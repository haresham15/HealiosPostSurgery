import os
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from sqlmodel import SQLModel, Field, Session, create_engine, select

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
default_db_path = os.path.join(BASE_DIR, "healios.db")
DB_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path}")
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    """
    Patient identity and clinical registry credentials.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(index=True, unique=True)
    display_name: str
    email: Optional[str] = None
    date_of_birth: Optional[str] = "1992-04-14"
    gender: Optional[str] = "Female"
    mrn: Optional[str] = "MRN-84920"
    procedure_name: Optional[str] = "Laparoscopic Appendectomy"
    surgery_date: Optional[str] = "2026-09-07"
    surgeon_name: Optional[str] = "Dr. Sarah Lin, MD"
    facility: Optional[str] = "St. Jude Surgical Pavilion"
    discharge_date: Optional[str] = "2026-09-08"
    clinic_phone: Optional[str] = "(555) 234-8901"
    emergency_name: Optional[str] = "Dmitri Rostov"
    emergency_phone: Optional[str] = "(555) 019-2834"
    emergency_relation: Optional[str] = "Spouse"
    allergies: Optional[str] = "NKDA (No Known Drug Allergies)"
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class Surgery(SQLModel, table=True):
    """
    Comprehensive surgical history record for tracking both current active
    recovery and past surgical interventions.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    procedure_name: str
    surgery_date: str  # YYYY-MM-DD
    surgeon_name: str
    facility: str = "St. Jude Surgical Pavilion"
    incision_site: str = "Abdominal - Lower Right Quadrant"
    discharge_date: Optional[str] = None
    target_pod: int = 14
    clinic_phone: str = "(555) 234-8901"
    is_active_recovery: bool = True  # True if this is currently monitored
    status: str = "recovering"  # recovering, healed, scheduled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class Observation(SQLModel, table=True):
    """
    Stores full wound scan assessment records, AI predictions, and tissue metrics.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    surgery_id: Optional[int] = Field(default=None, foreign_key="surgery.id", index=True)
    image_path: str
    heatmap_path: Optional[str] = None
    predicted_class: str
    confidence: float
    risk_score: int
    status: str  # healthy, warning, critical
    probabilities_json: Optional[str] = None
    ai_analysis: Optional[str] = None
    recommendations: Optional[str] = None
    tissue_metrics_json: Optional[str] = None
    doctor_alert: bool = False
    created_at: datetime = Field(default_factory=utc_now, index=True)


class VitalSign(SQLModel, table=True):
    """
    Stores patient vital signs telemetry.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    surgery_id: Optional[int] = Field(default=None, foreign_key="surgery.id", index=True)
    heart_rate: int
    blood_pressure_sys: int
    blood_pressure_dia: int
    temperature: float
    oxygen_saturation: int
    pain_score: int
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now, index=True)


class Medication(SQLModel, table=True):
    """
    Stores postoperative prescriptions, dosage, and daily intake adherence.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    surgery_id: Optional[int] = Field(default=None, foreign_key="surgery.id", index=True)
    name: str
    dosage: str
    frequency: str
    course_day: int = 1
    total_days: int = 7
    next_dose_time: str = "08:00 AM"
    is_antibiotic: bool = False
    is_taken: bool = False
    last_taken_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utc_now)


class SymptomLog(SQLModel, table=True):
    """
    Stores free-text symptom reports and patient inquiries with clinical urgency rating.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    surgery_id: Optional[int] = Field(default=None, foreign_key="surgery.id", index=True)
    free_text: str
    urgency: float = 0.0
    category: Optional[str] = "General"
    created_at: datetime = Field(default_factory=utc_now, index=True)


class RiskScore(SQLModel, table=True):
    """
    Tracks longitudinal ERAS composite surgical risk score over post-op days.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    surgery_id: Optional[int] = Field(default=None, foreign_key="surgery.id", index=True)
    score_0_100: int
    reason: str
    created_at: datetime = Field(default_factory=utc_now)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def get_or_create_user(
    session: Session,
    external_id: str,
    display_name: str = "Elena Rostova",
    procedure_name: str = "Laparoscopic Appendectomy",
    surgeon_name: str = "Dr. Sarah Lin, MD",
    email: Optional[str] = None,
) -> User:
    user = session.exec(select(User).where(User.external_id == external_id)).first()
    if user:
        return user

    user = User(
        external_id=external_id,
        display_name=display_name,
        procedure_name=procedure_name,
        surgeon_name=surgeon_name,
        email=email or f"{external_id}@patient.healios.health",
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Seed initial clinical recovery regime and surgery history
    seed_default_patient_data(session, user.id, procedure_name, surgeon_name)
    return user


def seed_default_patient_data(
    session: Session,
    user_id: int,
    procedure_name: str = "Laparoscopic Appendectomy",
    surgeon_name: str = "Dr. Sarah Lin, MD",
):
    """
    Pre-populates realistic multi-surgery history, medications, and vitals.
    """
    # 1. Surgeries
    existing_surgeries = session.exec(select(Surgery).where(Surgery.user_id == user_id)).all()
    active_surgery_id = None

    if not existing_surgeries:
        # Determine surgical defaults depending on patient
        surgeries = [
            Surgery(
                user_id=user_id,
                procedure_name=procedure_name,
                surgery_date="2026-09-07",
                surgeon_name=surgeon_name,
                facility="St. Jude Surgical Pavilion — Suite 402",
                incision_site="Abdominal (McBurney Point / 3-port laparoscopy)",
                discharge_date="2026-09-08",
                target_pod=14,
                clinic_phone="(555) 234-8901",
                is_active_recovery=True,
                status="recovering",
                notes="Uncomplicated laparoscopic appendectomy. Hemostasis verified. 3 absorbable sutures with Dermabond."
            ),
            Surgery(
                user_id=user_id,
                procedure_name="Right Inguinal Hernia Mesh Repair",
                surgery_date="2024-10-12",
                surgeon_name="Dr. Robert Chen, FACS",
                facility="Mercy General Ambulatory Center",
                incision_site="Right Inguinal Canal",
                discharge_date="2024-10-12",
                target_pod=21,
                clinic_phone="(555) 489-1120",
                is_active_recovery=False,
                status="healed",
                notes="Open Lichtenstein mesh repair. 100% full recovery without chronic neuralgia."
            ),
            Surgery(
                user_id=user_id,
                procedure_name="Wisdom Teeth Extraction (4x Impacted)",
                surgery_date="2021-06-18",
                surgeon_name="Dr. Lisa Nguyen, DDS MD",
                facility="Bay Area Maxillofacial Surgery",
                incision_site="Oral / Mandibular & Maxillary",
                discharge_date="2021-06-18",
                target_pod=7,
                clinic_phone="(555) 890-3341",
                is_active_recovery=False,
                status="healed",
                notes="Full surgical bone extraction under IV sedation. Resolved without dry socket."
            ),
        ]
        session.add_all(surgeries)
        session.commit()
        for s in surgeries:
            if s.is_active_recovery:
                active_surgery_id = s.id
                break
    else:
        for s in existing_surgeries:
            if s.is_active_recovery:
                active_surgery_id = s.id
                break

    # 2. Medications
    existing_meds = session.exec(select(Medication).where(Medication.user_id == user_id)).all()
    if not existing_meds:
        meds = [
            Medication(
                user_id=user_id,
                surgery_id=active_surgery_id,
                name="Cephalexin (Keflex)",
                dosage="500 mg",
                frequency="Every 8 hours",
                course_day=4,
                total_days=7,
                next_dose_time="02:00 PM",
                is_antibiotic=True,
                is_taken=True,
                last_taken_at=datetime.utcnow() - timedelta(hours=3),
            ),
            Medication(
                user_id=user_id,
                surgery_id=active_surgery_id,
                name="Acetaminophen (Tylenol)",
                dosage="650 mg",
                frequency="Every 6 hours as needed for mild pain",
                course_day=4,
                total_days=10,
                next_dose_time="06:00 PM",
                is_antibiotic=False,
                is_taken=True,
                last_taken_at=datetime.utcnow() - timedelta(hours=4),
            ),
            Medication(
                user_id=user_id,
                surgery_id=active_surgery_id,
                name="Ondansetron (Zofran)",
                dosage="4 mg",
                frequency="Every 8 hours as needed for nausea",
                course_day=4,
                total_days=5,
                next_dose_time="09:00 PM",
                is_antibiotic=False,
                is_taken=False,
            ),
            Medication(
                user_id=user_id,
                surgery_id=active_surgery_id,
                name="Docusate Sodium (Colace)",
                dosage="100 mg",
                frequency="Once daily before bedtime",
                course_day=4,
                total_days=7,
                next_dose_time="10:00 PM",
                is_antibiotic=False,
                is_taken=False,
            ),
        ]
        session.add_all(meds)

    # 3. Baseline Vitals
    existing_vitals = session.exec(select(VitalSign).where(VitalSign.user_id == user_id)).all()
    if not existing_vitals:
        vitals = [
            VitalSign(
                user_id=user_id,
                surgery_id=active_surgery_id,
                heart_rate=72,
                blood_pressure_sys=118,
                blood_pressure_dia=76,
                temperature=98.6,
                oxygen_saturation=99,
                pain_score=2,
                notes="Morning resting vitals post medication",
                created_at=datetime.utcnow() - timedelta(hours=4),
            ),
            VitalSign(
                user_id=user_id,
                surgery_id=active_surgery_id,
                heart_rate=76,
                blood_pressure_sys=122,
                blood_pressure_dia=78,
                temperature=98.9,
                oxygen_saturation=98,
                pain_score=3,
                notes="Post-walk check",
                created_at=datetime.utcnow() - timedelta(days=1),
            ),
        ]
        session.add_all(vitals)

    session.commit()


def seed_all_demo_patients(session: Session):
    """
    Seeds all 3 realistic clinical patient accounts so users have diverse surgical histories to test.
    """
    # 1. Elena Rostova - Appendectomy
    elena = session.exec(select(User).where(User.external_id == "pat-default")).first()
    if not elena:
        elena = User(
            external_id="pat-default",
            display_name="Elena Rostova",
            email="elena.rostova@patient.healios.health",
            date_of_birth="1992-04-14",
            gender="Female",
            mrn="MRN-84920",
            emergency_name="Dmitri Rostov",
            emergency_phone="(555) 019-2834",
            emergency_relation="Spouse",
            allergies="NKDA (No Known Drug Allergies)",
        )
        session.add(elena)
        session.commit()
        session.refresh(elena)
        seed_default_patient_data(session, elena.id, "Laparoscopic Appendectomy", "Dr. Sarah Lin, MD")

    # 2. Marcus Vance - Total Knee Arthroplasty
    marcus = session.exec(select(User).where(User.external_id == "pat-marcus")).first()
    if not marcus:
        marcus = User(
            external_id="pat-marcus",
            display_name="Marcus Vance",
            email="marcus.vance@patient.healios.health",
            date_of_birth="1968-11-23",
            gender="Male",
            mrn="MRN-39104",
            emergency_name="Helen Vance",
            emergency_phone="(555) 881-2309",
            emergency_relation="Wife",
            allergies="Sulfa drugs (rash)",
        )
        session.add(marcus)
        session.commit()
        session.refresh(marcus)
        
        # Add Marcus's surgeries
        s1 = Surgery(
            user_id=marcus.id,
            procedure_name="Total Knee Arthroplasty (Left)",
            surgery_date="2026-09-01",
            surgeon_name="Dr. James Sterling, MD",
            facility="Orthopedic Institute of the Pacific",
            incision_site="Left Knee Anterior Midline (20cm)",
            discharge_date="2026-09-03",
            target_pod=28,
            clinic_phone="(555) 772-9012",
            is_active_recovery=True,
            status="recovering",
            notes="Triathlon cruciate-retaining implant. Range of motion target 0-110 degrees."
        )
        s2 = Surgery(
            user_id=marcus.id,
            procedure_name="Left Partial Meniscectomy",
            surgery_date="2022-08-14",
            surgeon_name="Dr. Kevin Walsh, MD",
            facility="Metro Sports Medicine Pavilion",
            incision_site="Left Knee Anterolateral & Anteromedial portals",
            discharge_date="2022-08-14",
            target_pod=14,
            clinic_phone="(555) 332-1980",
            is_active_recovery=False,
            status="healed",
            notes="Arthroscopic partial medial meniscectomy. Full recovery attained."
        )
        session.add_all([s1, s2])
        session.commit()

    # 3. Sophia Chen - Robotic Cholecystectomy
    sophia = session.exec(select(User).where(User.external_id == "pat-sophia")).first()
    if not sophia:
        sophia = User(
            external_id="pat-sophia",
            display_name="Sophia Chen",
            email="sophia.chen@patient.healios.health",
            date_of_birth="1987-07-09",
            gender="Female",
            mrn="MRN-77412",
            emergency_name="David Chen",
            emergency_phone="(555) 412-8871",
            emergency_relation="Brother",
            allergies="Latex (contact dermatitis)",
        )
        session.add(sophia)
        session.commit()
        session.refresh(sophia)

        s_sophia = Surgery(
            user_id=sophia.id,
            procedure_name="Robotic Cholecystectomy",
            surgery_date="2026-09-09",
            surgeon_name="Dr. Rebecca Adams, FACS",
            facility="University Health Surgery Center",
            incision_site="Supraumbilical & Right Subcostal",
            discharge_date="2026-09-09",
            target_pod=10,
            clinic_phone="(555) 601-9923",
            is_active_recovery=True,
            status="recovering",
            notes="Da Vinci robotic gallbladder removal. Minimal blood loss (<10mL)."
        )
        session.add(s_sophia)
        session.commit()
