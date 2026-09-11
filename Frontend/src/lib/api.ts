const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  external_id: string;
  display_name: string;
  surgery_date?: string;
  procedure_name?: string;
  surgeon_name?: string;
  discharge_date?: string;
  clinic_phone?: string;
}

export interface ProbabilityItem {
  label: string;
  probability: number;
}

export interface TissueMetrics {
  epithelial_rate: string;
  erythema_radius: string;
  granulation_score: number;
  staple_integrity: string;
  exudate_level: string;
}

export interface WoundAssessmentRecord {
  id: number;
  user_id: number;
  image_path: string;
  predicted_class: string;
  confidence: number;
  risk_score: number;
  status: 'healthy' | 'warning' | 'critical';
  probabilities: ProbabilityItem[];
  ai_analysis?: string;
  recommendations?: string;
  tissue_metrics?: TissueMetrics;
  doctor_alert: boolean;
  created_at: string;
}

export interface VitalSignRecord {
  id: number;
  user_id: number;
  heart_rate: number;
  blood_pressure_sys: number;
  blood_pressure_dia: number;
  temperature: number;
  oxygen_saturation: number;
  pain_score: number;
  notes?: string;
  created_at: string;
}

export interface MedicationRecord {
  id: number;
  user_id: number;
  name: string;
  dosage: string;
  frequency: string;
  course_day: number;
  total_days: number;
  next_dose_time: string;
  is_antibiotic: boolean;
  is_taken: boolean;
  last_taken_at?: string;
}

export interface SymptomLog {
  id: number;
  user_id: number;
  free_text: string;
  urgency: number;
  category?: string;
  created_at: string;
}

export interface RecoverySummary {
  user: User;
  days_post_op: number;
  latest_assessment: WoundAssessmentRecord | null;
  latest_vitals: VitalSignRecord | null;
  recent_vitals: VitalSignRecord[];
  medications: MedicationRecord[];
  adherence_rate: number;
  composite_risk_score: number;
  escalation_needed: boolean;
}

export interface PredictionResult {
  filename: string;
  content_type: string;
  predictions: number[];
  predicted_class: string;
  confidence: number;
  risk_score: number;
  status: 'healthy' | 'warning' | 'critical';
  class_probabilities: ProbabilityItem[];
  analysis: string;
  recommendations: string;
  tissue_metrics: TissueMetrics;
  escalation_required: boolean;
  image_url?: string;
  saved_assessment_id?: number;
}

export const api = {
  // Health Check
  checkHealth: async (): Promise<{ status: string; model_loaded: boolean }> => {
    try {
      const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return { status: 'error', model_loaded: false };
      return res.json();
    } catch {
      return { status: 'offline', model_loaded: false };
    }
  },

  // User Management
  createUser: async (externalId: string, displayName: string): Promise<User> => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ external_id: externalId, display_name: displayName }),
    });
    if (!res.ok) throw new Error('Failed to create/fetch user');
    return res.json();
  },

  getUser: async (externalId: string): Promise<User> => {
    const res = await fetch(`${API_URL}/users/${externalId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Composite Recovery Summary (Single Roundtrip)
  getRecoverySummary: async (externalId: string = 'pat-default'): Promise<RecoverySummary | null> => {
    try {
      const res = await fetch(`${API_URL}/recovery-summary/${externalId}`);
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      console.warn('Backend unavailable, using local clinical store fallback.');
      return null;
    }
  },

  // Wound Assessments
  uploadAndPredict: async (
    file: File,
    userExternalId: string = 'pat-default',
    saveToHistory: boolean = true
  ): Promise<PredictionResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_URL}/predict?user_external_id=${encodeURIComponent(userExternalId)}&save_to_history=${saveToHistory}`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Prediction failed with status ${res.status}`);
    return res.json();
  },

  getAssessments: async (externalId: string = 'pat-default'): Promise<WoundAssessmentRecord[]> => {
    const res = await fetch(`${API_URL}/assessments?external_id=${encodeURIComponent(externalId)}`);
    if (!res.ok) throw new Error('Failed to fetch assessments');
    return res.json();
  },

  // Vitals Telemetry
  recordVitals: async (params: {
    userExternalId: string;
    heartRate: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
    temperature: number;
    oxygenSaturation: number;
    painScore: number;
    notes?: string;
  }): Promise<VitalSignRecord> => {
    const res = await fetch(`${API_URL}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_external_id: params.userExternalId,
        heart_rate: params.heartRate,
        blood_pressure_sys: params.bloodPressureSys,
        blood_pressure_dia: params.bloodPressureDia,
        temperature: params.temperature,
        oxygen_saturation: params.oxygenSaturation,
        pain_score: params.painScore,
        notes: params.notes,
      }),
    });
    if (!res.ok) throw new Error('Failed to record vitals');
    return res.json();
  },

  getVitals: async (externalId: string = 'pat-default'): Promise<VitalSignRecord[]> => {
    const res = await fetch(`${API_URL}/vitals?external_id=${encodeURIComponent(externalId)}`);
    if (!res.ok) throw new Error('Failed to fetch vitals');
    return res.json();
  },

  // Medications
  getMedications: async (externalId: string = 'pat-default'): Promise<MedicationRecord[]> => {
    const res = await fetch(`${API_URL}/medications?external_id=${encodeURIComponent(externalId)}`);
    if (!res.ok) throw new Error('Failed to fetch medications');
    return res.json();
  },

  toggleMedication: async (medId: number): Promise<MedicationRecord> => {
    const res = await fetch(`${API_URL}/medications/${medId}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to toggle medication');
    return res.json();
  },

  // Symptom Logs
  createLog: async (userExternalId: string, text: string, urgency: number = 0.0): Promise<SymptomLog> => {
    const res = await fetch(`${API_URL}/symptom-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_external_id: userExternalId,
        free_text: text,
        urgency: urgency,
      }),
    });
    if (!res.ok) throw new Error('Failed to create log');
    return res.json();
  },

  getLogs: async (userExternalId: string = 'pat-default'): Promise<SymptomLog[]> => {
    const res = await fetch(`${API_URL}/symptom-logs?external_id=${encodeURIComponent(userExternalId)}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },
};
