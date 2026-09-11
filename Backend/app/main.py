import os
import json
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
from dotenv import load_dotenv
from sqlmodel import Session, select

from .schemas import (
    PingResponse,
    UploadResponse,
    PredictResponse,
    ProbabilityItem,
    TissueMetrics,
    UserCreate,
    UserUpdate,
    UserRead,
    VitalSignCreate,
    VitalSignRead,
    MedicationCreate,
    MedicationUpdate,
    MedicationRead,
    SymptomLogCreate,
    SymptomLogRead,
    AssessmentRead,
    RecoverySummaryRead,
    AgentConsultRequest,
    AgentConsultResponse,
)
from .model import load_model, run_inference
from .rag import clinical_agent
from .db import (
    init_db,
    get_session,
    User,
    Observation,
    VitalSign,
    Medication,
    SymptomLog,
    RiskScore,
    get_or_create_user,
    seed_default_patient_data,
)
from .utils import save_image_bytes, analyze_symptom_urgency, ensure_dirs

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ensure_dirs(UPLOAD_DIR)

GLOBAL_MODEL = None


# --- Modern FastAPI Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown.
    Pre-warms the deep learning model and initializes the clinical database.
    """
    global GLOBAL_MODEL
    print("Initializing Healios Surgical Recovery Backend...")

    # 1. Initialize SQLite Database Tables
    init_db()
    print("Database tables initialized.")

    # 2. Load and Pre-warm Neural Network
    model_path = os.path.join(BASE_DIR, "wound_model_multiclass_finetuned.h5")
    if os.path.exists(model_path):
        GLOBAL_MODEL = load_model(model_path)
    else:
        print(f"Warning: Model file not found at {model_path}")

    # 3. Seed Default Patient Account ('pat-default') for Instant Out-of-the-Box Operation
    try:
        from .db import engine
        with Session(engine) as session:
            get_or_create_user(session, external_id="pat-default", display_name="Elena Rostova")
            print("Default patient 'pat-default' verified.")
    except Exception as e:
        print(f"Initial seed notice: {e}")

    yield

    # Clean shutdown
    print("Shutting down Healios Backend.")


app = FastAPI(
    title="Healios Post-Surgical Recovery API",
    description="High-performance clinical AI backend for wound classification, multimodal vital telemetry, and medication tracking.",
    version="2.0.0",
    lifespan=lifespan,
)

# Static file serving for persisted wound scans
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS Middleware
allowed_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,https://healios-frontend.onrender.com"
)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip() and origin.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Root & System Health ---
@app.get("/", include_in_schema=False)
def root():
    return {
        "service": "Healios Surgical Recovery AI Engine",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "model_loaded": GLOBAL_MODEL is not None,
    }


@app.get("/health", response_model=PingResponse)
def health():
    return PingResponse(
        status="ok",
        model_loaded=GLOBAL_MODEL is not None,
        timestamp=datetime.now(timezone.utc),
    )


# --- User & Patient Profile Management ---
@app.post("/users", response_model=UserRead)
def create_or_get_user(user_data: UserCreate, session: Session = Depends(get_session)):
    user = get_or_create_user(
        session,
        external_id=user_data.external_id,
        display_name=user_data.display_name,
        procedure_name=user_data.procedure_name or "Laparoscopic Appendectomy",
        surgeon_name=user_data.surgeon_name or "Dr. Sarah Lin, MD",
    )
    return user


@app.get("/users/{external_id}", response_model=UserRead)
def get_user_profile(external_id: str, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        # Fallback create with defaults
        user = get_or_create_user(session, external_id=external_id)
    return user


@app.patch("/users/{external_id}", response_model=UserRead)
def update_user_profile(external_id: str, update_data: UserUpdate, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if update_data.display_name is not None:
        user.display_name = update_data.display_name
    if update_data.procedure_name is not None:
        user.procedure_name = update_data.procedure_name
    if update_data.surgery_date is not None:
        user.surgery_date = update_data.surgery_date
    if update_data.surgeon_name is not None:
        user.surgeon_name = update_data.surgeon_name
    if update_data.clinic_phone is not None:
        user.clinic_phone = update_data.clinic_phone
    if update_data.discharge_date is not None:
        user.discharge_date = update_data.discharge_date
    if update_data.emergency_name is not None:
        user.emergency_name = update_data.emergency_name
    if update_data.emergency_phone is not None:
        user.emergency_phone = update_data.emergency_phone
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# --- High-Performance AI Wound Classification ---
@app.post("/predict", response_model=PredictResponse)
async def predict_wound(
    file: UploadFile = File(...),
    user_external_id: Optional[str] = Query("pat-default", description="Patient identifier to associate scan with"),
    save_to_history: bool = Query(True, description="Whether to store this assessment in patient records"),
    session: Session = Depends(get_session),
) -> PredictResponse:
    """
    Accepts an uploaded image of a surgical wound.
    Runs non-blocking MobileNetV2 inference via threadpool and applies post-surgical
    clinical rules to evaluate healing, risk, tissue metrics, and doctor escalation.
    """
    global GLOBAL_MODEL

    if GLOBAL_MODEL is None:
        model_path = os.path.join(BASE_DIR, "wound_model_multiclass_finetuned.h5")
        if os.path.exists(model_path):
            GLOBAL_MODEL = await run_in_threadpool(load_model, model_path)

    image_bytes = await file.read()
    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image payload")

    try:
        # 1. Non-blocking threadpool execution for CPU-intensive inference + Grad-CAM
        eval_result = await run_in_threadpool(run_inference, GLOBAL_MODEL, image_bytes, UPLOAD_DIR)

        # 2. Persist image file safely to uploads directory
        local_path, public_url = save_image_bytes(image_bytes, UPLOAD_DIR, file.filename or "scan.jpg")
        heatmap_url = eval_result.get("heatmap_url")

        saved_id = None
        # 3. Associate with patient database record if requested
        if save_to_history and user_external_id:
            user = session.exec(select(User).where(User.external_id == user_external_id)).first()
            if not user:
                user = get_or_create_user(session, external_id=user_external_id)

            obs = Observation(
                user_id=user.id,
                image_path=public_url,
                heatmap_path=heatmap_url,
                predicted_class=eval_result["predicted_class"],
                confidence=eval_result["confidence"],
                risk_score=eval_result["risk_score"],
                status=eval_result["status"],
                probabilities_json=json.dumps(eval_result["probabilities"]),
                ai_analysis=eval_result["ai_analysis"],
                recommendations=eval_result["recommendations"],
                tissue_metrics_json=json.dumps(eval_result["tissue_metrics"]),
                doctor_alert=eval_result["escalation_required"],
            )
            session.add(obs)
            session.commit()
            session.refresh(obs)
            saved_id = obs.id

        # 4. Construct response
        class_prob_items = [ProbabilityItem(**item) for item in eval_result["probabilities"]]
        metrics = TissueMetrics(**eval_result["tissue_metrics"])

        return PredictResponse(
            filename=file.filename or "scan.jpg",
            content_type=file.content_type or "image/jpeg",
            predictions=eval_result["raw_predictions"],  # 100% backward compatible
            predicted_class=eval_result["predicted_class"],
            confidence=eval_result["confidence"],
            risk_score=eval_result["risk_score"],
            status=eval_result["status"],
            class_probabilities=class_prob_items,
            analysis=eval_result["ai_analysis"],
            recommendations=eval_result["recommendations"],
            tissue_metrics=metrics,
            escalation_required=eval_result["escalation_required"],
            image_url=public_url,
            heatmap_url=heatmap_url,
            saved_assessment_id=saved_id,
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image processing error: {str(e)}")


# --- Wound Assessment History Endpoints ---
@app.get("/assessments", response_model=List[AssessmentRead])
def get_patient_assessments(
    external_id: str = Query("pat-default"),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        return []

    observations = session.exec(
        select(Observation)
        .where(Observation.user_id == user.id)
        .order_by(Observation.created_at.desc())
        .limit(limit)
    ).all()

    results = []
    for obs in observations:
        probs = []
        if obs.probabilities_json:
            try:
                probs = [ProbabilityItem(**x) for x in json.loads(obs.probabilities_json)]
            except Exception:
                pass
        tm = None
        if obs.tissue_metrics_json:
            try:
                tm = TissueMetrics(**json.loads(obs.tissue_metrics_json))
            except Exception:
                pass

        results.append(
            AssessmentRead(
                id=obs.id,
                user_id=obs.user_id,
                image_path=obs.image_path,
                heatmap_path=obs.heatmap_path,
                predicted_class=obs.predicted_class,
                confidence=obs.confidence,
                risk_score=obs.risk_score,
                status=obs.status,
                probabilities=probs,
                ai_analysis=obs.ai_analysis,
                recommendations=obs.recommendations,
                tissue_metrics=tm,
                doctor_alert=obs.doctor_alert,
                created_at=obs.created_at,
            )
        )
    return results


@app.get("/assessments/latest", response_model=Optional[AssessmentRead])
def get_latest_assessment(
    external_id: str = Query("pat-default"),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        return None

    obs = session.exec(
        select(Observation)
        .where(Observation.user_id == user.id)
        .order_by(Observation.created_at.desc())
    ).first()

    if not obs:
        return None

    probs = []
    if obs.probabilities_json:
        try:
            probs = [ProbabilityItem(**x) for x in json.loads(obs.probabilities_json)]
        except Exception:
            pass
    tm = None
    if obs.tissue_metrics_json:
        try:
            tm = TissueMetrics(**json.loads(obs.tissue_metrics_json))
        except Exception:
            pass

    return AssessmentRead(
        id=obs.id,
        user_id=obs.user_id,
        image_path=obs.image_path,
        heatmap_path=obs.heatmap_path,
        predicted_class=obs.predicted_class,
        confidence=obs.confidence,
        risk_score=obs.risk_score,
        status=obs.status,
        probabilities=probs,
        ai_analysis=obs.ai_analysis,
        recommendations=obs.recommendations,
        tissue_metrics=tm,
        doctor_alert=obs.doctor_alert,
        created_at=obs.created_at,
    )


# --- Vital Signs Telemetry Endpoints ---
@app.post("/vitals", response_model=VitalSignRead)
def record_vitals(vital_data: VitalSignCreate, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.external_id == vital_data.user_external_id)).first()
    if not user:
        user = get_or_create_user(session, external_id=vital_data.user_external_id)

    new_vital = VitalSign(
        user_id=user.id,
        heart_rate=vital_data.heart_rate,
        blood_pressure_sys=vital_data.blood_pressure_sys,
        blood_pressure_dia=vital_data.blood_pressure_dia,
        temperature=vital_data.temperature,
        oxygen_saturation=vital_data.oxygen_saturation,
        pain_score=vital_data.pain_score,
        notes=vital_data.notes,
    )
    session.add(new_vital)
    session.commit()
    session.refresh(new_vital)
    return new_vital


@app.get("/vitals", response_model=List[VitalSignRead])
def get_vitals_history(
    external_id: str = Query("pat-default"),
    limit: int = Query(30, ge=1, le=100),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        user = get_or_create_user(session, external_id=external_id)

    vitals = session.exec(
        select(VitalSign)
        .where(VitalSign.user_id == user.id)
        .order_by(VitalSign.created_at.desc())
        .limit(limit)
    ).all()
    return vitals


# --- Medications & Adherence Endpoints ---
@app.get("/medications", response_model=List[MedicationRead])
def get_medications(
    external_id: str = Query("pat-default"),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        user = get_or_create_user(session, external_id=external_id)

    meds = session.exec(
        select(Medication)
        .where(Medication.user_id == user.id)
        .order_by(Medication.is_taken.asc(), Medication.id.asc())
    ).all()

    # If no meds exist yet, seed standard post-op bundle
    if not meds:
        seed_default_patient_data(session, user.id)
        meds = session.exec(
            select(Medication).where(Medication.user_id == user.id)
        ).all()

    return meds


@app.post("/medications", response_model=MedicationRead)
def add_medication(med_data: MedicationCreate, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.external_id == med_data.user_external_id)).first()
    if not user:
        user = get_or_create_user(session, external_id=med_data.user_external_id)

    new_med = Medication(
        user_id=user.id,
        name=med_data.name,
        dosage=med_data.dosage,
        frequency=med_data.frequency,
        course_day=med_data.course_day,
        total_days=med_data.total_days,
        next_dose_time=med_data.next_dose_time,
        is_antibiotic=med_data.is_antibiotic,
        is_taken=False,
    )
    session.add(new_med)
    session.commit()
    session.refresh(new_med)
    return new_med


@app.patch("/medications/{med_id}/toggle", response_model=MedicationRead)
def toggle_medication_taken(med_id: int, session: Session = Depends(get_session)):
    med = session.get(Medication, med_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    med.is_taken = not med.is_taken
    med.last_taken_at = datetime.utcnow() if med.is_taken else None
    session.add(med)
    session.commit()
    session.refresh(med)
    return med


@app.post("/medications/reset-daily")
def reset_daily_medications(
    external_id: str = Query("pat-default"),
    session: Session = Depends(get_session),
):
    """
    Resets all medication taken status for the start of a new post-op day.
    """
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    meds = session.exec(select(Medication).where(Medication.user_id == user.id)).all()
    for med in meds:
        med.is_taken = False
        if med.course_day < med.total_days:
            med.course_day += 1
        session.add(med)
    session.commit()
    return {"message": "Medications reset for next post-op day", "count": len(meds)}


# --- Symptom Log Endpoints ---
@app.post("/symptom-logs", response_model=SymptomLogRead)
def create_symptom_log(log_data: SymptomLogCreate, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.external_id == log_data.user_external_id)).first()
    if not user:
        user = get_or_create_user(session, external_id=log_data.user_external_id)

    # Use heuristic NLP analysis if urgency was default or 0
    urgency = log_data.urgency
    category = log_data.category or "General"
    if urgency <= 0.05:
        calc_urgency, auto_cat = analyze_symptom_urgency(log_data.free_text)
        urgency = calc_urgency
        category = auto_cat

    new_log = SymptomLog(
        user_id=user.id,
        free_text=log_data.free_text,
        urgency=urgency,
        category=category,
    )
    session.add(new_log)
    session.commit()
    session.refresh(new_log)
    return new_log


@app.get("/symptom-logs", response_model=List[SymptomLogRead])
def get_symptom_logs(
    external_id: str = Query("pat-default"),
    limit: int = Query(30, ge=1, le=100),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        return []

    logs = session.exec(
        select(SymptomLog)
        .where(SymptomLog.user_id == user.id)
        .order_by(SymptomLog.created_at.desc())
        .limit(limit)
    ).all()
    return logs


# --- Composite Recovery Summary Endpoint ---
@app.get("/recovery-summary/{external_id}", response_model=RecoverySummaryRead)
def get_recovery_summary(external_id: str, session: Session = Depends(get_session)):
    """
    High-efficiency composite endpoint that aggregates patient identity, latest
    wound assessment, recent vitals, and medication adherence in a single network roundtrip.
    """
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if not user:
        user = get_or_create_user(session, external_id=external_id)

    # Latest assessment
    latest_obs = session.exec(
        select(Observation)
        .where(Observation.user_id == user.id)
        .order_by(Observation.created_at.desc())
    ).first()

    latest_assessment = None
    if latest_obs:
        probs = []
        if latest_obs.probabilities_json:
            try:
                probs = [ProbabilityItem(**x) for x in json.loads(latest_obs.probabilities_json)]
            except Exception:
                pass
        tm = None
        if latest_obs.tissue_metrics_json:
            try:
                tm = TissueMetrics(**json.loads(latest_obs.tissue_metrics_json))
            except Exception:
                pass
        latest_assessment = AssessmentRead(
            id=latest_obs.id,
            user_id=latest_obs.user_id,
            image_path=latest_obs.image_path,
            heatmap_path=latest_obs.heatmap_path,
            predicted_class=latest_obs.predicted_class,
            confidence=latest_obs.confidence,
            risk_score=latest_obs.risk_score,
            status=latest_obs.status,
            probabilities=probs,
            ai_analysis=latest_obs.ai_analysis,
            recommendations=latest_obs.recommendations,
            tissue_metrics=tm,
            doctor_alert=latest_obs.doctor_alert,
            created_at=latest_obs.created_at,
        )

    # Recent Vitals
    recent_vitals_models = session.exec(
        select(VitalSign)
        .where(VitalSign.user_id == user.id)
        .order_by(VitalSign.created_at.desc())
        .limit(7)
    ).all()
    recent_vitals = [VitalSignRead.model_validate(v) for v in recent_vitals_models]
    latest_vital = recent_vitals[0] if recent_vitals else None

    # Medications
    meds_models = session.exec(
        select(Medication)
        .where(Medication.user_id == user.id)
    ).all()
    if not meds_models:
        seed_default_patient_data(session, user.id)
        meds_models = session.exec(select(Medication).where(Medication.user_id == user.id)).all()

    meds = [MedicationRead.model_validate(m) for m in meds_models]

    taken_count = sum(1 for m in meds if m.is_taken)
    adherence = int((taken_count / len(meds)) * 100) if meds else 100

    # Calculate days post op
    days_post_op = 4
    if user.surgery_date:
        try:
            s_date = datetime.strptime(user.surgery_date, "%Y-%m-%d").date()
            days_post_op = max(1, (datetime.now(timezone.utc).date() - s_date).days)
        except Exception:
            days_post_op = 4

    # Composite risk calculation
    wound_risk = latest_assessment.risk_score if latest_assessment else 12
    vital_risk = 5
    if latest_vital:
        if latest_vital.temperature > 100.4 or latest_vital.heart_rate > 100 or latest_vital.pain_score >= 7:
            vital_risk = 45
        elif latest_vital.temperature > 99.5 or latest_vital.pain_score >= 5:
            vital_risk = 25

    composite_risk = max(wound_risk, vital_risk)
    escalation = (latest_assessment.doctor_alert if latest_assessment else False) or (vital_risk >= 40)

    return RecoverySummaryRead(
        user=UserRead.model_validate(user),
        days_post_op=days_post_op,
        latest_assessment=latest_assessment,
        latest_vitals=latest_vital,
        recent_vitals=recent_vitals,
        medications=meds,
        adherence_rate=adherence,
        composite_risk_score=composite_risk,
        escalation_needed=escalation,
    )


# --- Clinical Recovery Agent Endpoints ---
@app.post("/agent/consult", response_model=AgentConsultResponse)
def consult_recovery_agent(
    req: AgentConsultRequest,
    session: Session = Depends(get_session),
):
    """
    Multimodal clinical recovery agent. Executes diagnostic EHR tools across
    recent patient vitals, wound scans, and medication adherence, returning
    evidence-grounded recommendations cited from verified ERAS protocols.
    """
    user = session.exec(select(User).where(User.external_id == req.user_external_id)).first()
    if not user:
        user = get_or_create_user(session, external_id=req.user_external_id)

    return clinical_agent.consult(
        session=session,
        user=user,
        query=req.query,
        include_biometrics=req.include_biometrics,
    )

