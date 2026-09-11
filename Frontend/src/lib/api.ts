const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  external_id: string;
  display_name: string;
  name?: string;
  age?: number;
  gender?: string;
  mrn?: string;
  surgery_date?: string;
  procedure_name?: string;
  surgeon_name?: string;
  facility?: string;
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
  granulation_pct?: number;
  slough_pct?: number;
  necrosis_pct?: number;
  granulation_percent?: number;
  slough_percent?: number;
  necrosis_percent?: number;
  erythema_index?: number;
}

export interface WoundAssessmentRecord {
  id: number;
  user_id: number;
  image_path: string;
  heatmap_path?: string;
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
  heart_rate?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  temperature?: number;
  oxygen_saturation?: number;
  oxygen_sat?: number;
  pain_score?: number;
  notes?: string;
  created_at?: string;
  timestamp?: string;
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
  taken_today?: boolean;
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
  user?: User;
  patient?: User;
  days_post_op: number;
  latest_assessment: WoundAssessmentRecord | null;
  latest_vitals: VitalSignRecord | null;
  recent_vitals?: VitalSignRecord[];
  medications?: MedicationRecord[];
  active_medications_count?: number;
  adherence_rate?: number;
  composite_risk_score?: number;
  risk_score?: number;
  risk_level?: string;
  escalation_needed?: boolean;
}

export type RecoverySummaryResponse = RecoverySummary;

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
  heatmap_url?: string;
  saved_assessment_id?: number;
}

export interface CitationItem {
  protocol_id: string;
  title: string;
  section: string;
  guideline: string;
}

export interface AgentConsultResponse {
  response: string;
  urgency: 'nominal' | 'warning' | 'critical';
  escalate_to_surgeon: boolean;
  citations: CitationItem[];
  tools_executed: string[];
  timestamp: string;
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
  recordVitals: async (
    paramsOrUserId:
      | string
      | {
          userExternalId?: string;
          heartRate?: number;
          bloodPressureSys?: number;
          bloodPressureDia?: number;
          temperature?: number;
          oxygenSaturation?: number;
          painScore?: number;
          notes?: string;
        },
    maybePayload?: {
      heart_rate?: number;
      blood_pressure_sys?: number;
      blood_pressure_dia?: number;
      temperature?: number;
      oxygen_sat?: number;
      pain_score?: number;
    }
  ): Promise<VitalSignRecord> => {
    let bodyData: any;
    if (typeof paramsOrUserId === 'string') {
      bodyData = {
        user_external_id: paramsOrUserId,
        heart_rate: maybePayload?.heart_rate ?? 72,
        blood_pressure_sys: maybePayload?.blood_pressure_sys ?? 120,
        blood_pressure_dia: maybePayload?.blood_pressure_dia ?? 80,
        temperature: maybePayload?.temperature ?? 98.6,
        oxygen_saturation: maybePayload?.oxygen_sat ?? 98,
        pain_score: maybePayload?.pain_score ?? 2,
      };
    } else {
      bodyData = {
        user_external_id: paramsOrUserId.userExternalId || 'pat-default',
        heart_rate: paramsOrUserId.heartRate ?? 72,
        blood_pressure_sys: paramsOrUserId.bloodPressureSys ?? 120,
        blood_pressure_dia: paramsOrUserId.bloodPressureDia ?? 80,
        temperature: paramsOrUserId.temperature ?? 98.6,
        oxygen_saturation: paramsOrUserId.oxygenSaturation ?? 98,
        pain_score: paramsOrUserId.painScore ?? 2,
        notes: paramsOrUserId.notes,
      };
    }

    const res = await fetch(`${API_URL}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
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

  addMedication: async (
    paramsOrUserId:
      | string
      | {
          userExternalId: string;
          name: string;
          dosage: string;
          frequency: string;
          course_day?: number;
          total_days?: number;
          next_dose_time?: string;
          is_antibiotic?: boolean;
        },
    maybeMed?: {
      name: string;
      dosage: string;
      frequency?: string;
      is_antibiotic?: boolean;
    }
  ): Promise<MedicationRecord> => {
    let bodyData: any;
    if (typeof paramsOrUserId === 'string' && maybeMed) {
      bodyData = {
        user_external_id: paramsOrUserId,
        name: maybeMed.name,
        dosage: maybeMed.dosage,
        frequency: maybeMed.frequency || 'Once daily',
        course_day: 1,
        total_days: 7,
        next_dose_time: '08:00 AM',
        is_antibiotic: maybeMed.is_antibiotic || false,
      };
    } else {
      const p = paramsOrUserId as any;
      bodyData = {
        user_external_id: p.userExternalId,
        name: p.name,
        dosage: p.dosage,
        frequency: p.frequency,
        course_day: p.course_day || 1,
        total_days: p.total_days || 7,
        next_dose_time: p.next_dose_time || '08:00 AM',
        is_antibiotic: p.is_antibiotic || false,
      };
    }
    const res = await fetch(`${API_URL}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
    if (!res.ok) throw new Error('Failed to add medication');
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
    if (!res.ok) throw new Error('Failed to fetch symptom logs');
    return res.json();
  },


  updateUser: async (externalId: string, updates: Partial<User>): Promise<User> => {
    const res = await fetch(`${API_URL}/users/${externalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    return res.json();
  },

  // Clinical Recovery Agent
  consultAgent: async (query: string, userExternalId: string = 'pat-default'): Promise<AgentConsultResponse> => {
    const res = await fetch(`${API_URL}/agent/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_external_id: userExternalId,
        query,
        include_biometrics: true,
      }),
    });
    if (!res.ok) throw new Error('Clinical agent inquiry failed');
    return res.json();
  },
};
