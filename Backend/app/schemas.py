from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PingResponse(BaseModel):
    status: str = Field(default="ok")
    model_loaded: bool = True
    timestamp: datetime = Field(default_factory=utc_now)
    service: str = "Healios Surgical Recovery AI Engine"
    version: str = "2.0.0"


class UploadResponse(BaseModel):
    name: str
    size: int
    url: Optional[str] = None


class ProbabilityItem(BaseModel):
    label: str
    probability: float


class TissueMetrics(BaseModel):
    epithelial_rate: str = "+1.6 mm/day"
    erythema_radius: str = "< 2 mm (Normal)"
    granulation_score: int = 95
    staple_integrity: str = "All staples / sutures intact and well-aligned"
    exudate_level: str = "Serosanguinous (trace)"
    granulation_pct: Optional[float] = 88.5
    slough_pct: Optional[float] = 8.2
    necrosis_pct: Optional[float] = 0.0
    granulation_percent: Optional[float] = 88.5
    slough_percent: Optional[float] = 8.2
    necrosis_percent: Optional[float] = 0.0
    erythema_index: Optional[float] = 1.2


class PredictResponse(BaseModel):
    filename: str
    content_type: str
    predictions: List[float]  # Keeps 100% backward-compatibility with existing frontend
    predicted_class: str
    confidence: float
    risk_score: int
    status: str
    class_probabilities: List[ProbabilityItem]
    analysis: str
    recommendations: str
    tissue_metrics: TissueMetrics
    escalation_required: bool
    image_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    saved_assessment_id: Optional[int] = None


# --- User Schemas ---
class UserBase(BaseModel):
    external_id: str
    display_name: str
    surgery_date: Optional[str] = "2026-09-07"
    procedure_name: Optional[str] = "Laparoscopic Appendectomy"
    surgeon_name: Optional[str] = "Dr. Sarah Lin, MD"
    discharge_date: Optional[str] = "2026-09-08"
    clinic_phone: Optional[str] = "(555) 234-8901"


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    procedure_name: Optional[str] = None
    surgery_date: Optional[str] = None
    surgeon_name: Optional[str] = None
    clinic_phone: Optional[str] = None
    discharge_date: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_phone: Optional[str] = None


class UserRead(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Vitals Schemas ---
class VitalSignCreate(BaseModel):
    user_external_id: str
    heart_rate: int = Field(ge=30, le=250)
    blood_pressure_sys: int = Field(ge=50, le=260)
    blood_pressure_dia: int = Field(ge=30, le=160)
    temperature: float = Field(ge=90.0, le=110.0)
    oxygen_saturation: int = Field(ge=50, le=100)
    pain_score: int = Field(ge=0, le=10)
    notes: Optional[str] = None


class VitalSignRead(BaseModel):
    id: int
    user_id: int
    heart_rate: int
    blood_pressure_sys: int
    blood_pressure_dia: int
    temperature: float
    oxygen_saturation: int
    pain_score: int
    notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Medication Schemas ---
class MedicationCreate(BaseModel):
    user_external_id: str
    name: str
    dosage: str
    frequency: str
    course_day: int = 1
    total_days: int = 7
    next_dose_time: str = "08:00 AM"
    is_antibiotic: bool = False


class MedicationUpdate(BaseModel):
    is_taken: Optional[bool] = None
    course_day: Optional[int] = None
    next_dose_time: Optional[str] = None


class MedicationRead(BaseModel):
    id: int
    user_id: int
    name: str
    dosage: str
    frequency: str
    course_day: int
    total_days: int
    next_dose_time: str
    is_antibiotic: bool
    is_taken: bool
    last_taken_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# --- Symptom Log Schemas ---
class SymptomLogBase(BaseModel):
    free_text: str
    urgency: float = 0.0
    category: Optional[str] = "General"


class SymptomLogCreate(SymptomLogBase):
    user_external_id: str


class SymptomLogRead(SymptomLogBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Assessment / Observation Schemas ---
class AssessmentCreate(BaseModel):
    user_external_id: str
    image_path: str
    predicted_class: str
    confidence: float
    risk_score: int
    status: str
    probabilities: List[ProbabilityItem]
    ai_analysis: str
    recommendations: str
    tissue_metrics: TissueMetrics
    doctor_alert: bool = False


class AssessmentRead(BaseModel):
    id: int
    user_id: int
    image_path: str
    heatmap_path: Optional[str] = None
    predicted_class: str
    confidence: float
    risk_score: int
    status: str
    probabilities: List[ProbabilityItem]
    ai_analysis: Optional[str] = None
    recommendations: Optional[str] = None
    tissue_metrics: Optional[TissueMetrics] = None
    doctor_alert: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- Recovery Composite Summary Schema ---
class RecoverySummaryRead(BaseModel):
    user: UserRead
    days_post_op: int
    latest_assessment: Optional[AssessmentRead] = None
    latest_vitals: Optional[VitalSignRead] = None
    recent_vitals: List[VitalSignRead] = []
    medications: List[MedicationRead] = []
    adherence_rate: int = 100
    composite_risk_score: int = 12
    escalation_needed: bool = False
    model_config = ConfigDict(from_attributes=True)


# --- Clinical RAG & Recovery Agent Schemas ---
class CitationItem(BaseModel):
    protocol_id: str
    title: str
    section: str
    guideline: str


class AgentConsultRequest(BaseModel):
    user_external_id: str = "pat-default"
    query: str
    include_biometrics: bool = True


class AgentConsultResponse(BaseModel):
    response: str
    urgency: str  # nominal, warning, critical
    escalate_to_surgeon: bool
    citations: List[CitationItem] = []
    tools_executed: List[str] = []
    timestamp: datetime = Field(default_factory=utc_now)

