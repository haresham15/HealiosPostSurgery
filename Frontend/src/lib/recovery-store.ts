'use client';

export interface WoundAssessment {
  id: string;
  created_at: string;
  image_url: string;
  baseline_url?: string;
  predicted_class: string;
  status: 'healthy' | 'warning' | 'critical';
  risk_score: number;
  confidence: number;
  probabilities: { label: string; probability: number }[];
  ai_analysis: string;
  recommendations: string;
  tissue_metrics?: {
    epithelial_rate: string;
    erythema_radius: string;
    granulation_score: number;
    staple_integrity: string;
    exudate_level: 'None' | 'Serous Minimal' | 'Moderate' | 'Purulent High';
  };
}

export interface VitalRecord {
  id: string;
  type: 'heart-rate' | 'blood-pressure' | 'temperature' | 'oxygen' | 'incision-delta';
  label: string;
  value: string;
  unit: string;
  status: 'nominal' | 'warning' | 'critical';
  timestamp: string;
  history: number[];
  normative: string;
}

export interface MedicationRecord {
  id: string;
  name: string;
  category: 'Antibiotic' | 'Analgesic' | 'Anticoagulant' | 'Anti-inflammatory';
  dosage: string;
  frequency: string;
  scheduleSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime';
  completedToday: boolean;
  totalDays: number;
  currentDay: number;
  instructions: string;
}

export interface RecoveryMilestone {
  id: string;
  label: string;
  category: 'Wound Care' | 'Mobility' | 'Nutrition' | 'Vitals';
  completed: boolean;
  dueTime?: string;
}

export interface PatientPassport {
  name: string;
  mrn: string;
  age: number;
  gender: string;
  procedure: string;
  surgeryDate: string;
  postOpDay: number;
  attendingSurgeon: string;
  surgicalFacility: string;
  dischargeTargetPOD: number;
  healingStage: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const STORAGE_KEYS = {
  PASSPORT: 'healios_passport',
  ASSESSMENTS: 'healios_wound_assessments',
  VITALS: 'healios_vitals',
  MEDICATIONS: 'healios_medications',
  MILESTONES: 'healios_milestones',
};

// High-fidelity Clinical Seed Data
const DEFAULT_PASSPORT: PatientPassport = {
  name: 'Eleanor Vance',
  mrn: 'HL-88294-A',
  age: 54,
  gender: 'Female',
  procedure: 'Laparoscopic Hemicolectomy w/ Anastomosis',
  surgeryDate: '2026-09-05',
  postOpDay: 6,
  attendingSurgeon: 'Dr. Arthur Campbell, MD, FACS',
  surgicalFacility: 'St. Jude Surgical Pavilion — PACU Pod 3',
  dischargeTargetPOD: 8,
  healingStage: 'Proliferative Phase (Epithelial Bridging)',
  emergencyContact: {
    name: 'Mark Vance (Spouse)',
    phone: '+1 (555) 382-9014',
    relationship: 'Spouse / Next of Kin',
  },
};

const DEFAULT_ASSESSMENTS: WoundAssessment[] = [
  {
    id: 'eval-001',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    baseline_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    predicted_class: 'Surgical Wounds',
    status: 'healthy',
    risk_score: 18,
    confidence: 0.94,
    probabilities: [
      { label: 'Normal', probability: 0.82 },
      { label: 'Surgical Wounds', probability: 0.94 },
      { label: 'Abrasions', probability: 0.03 },
      { label: 'Bruises', probability: 0.02 },
      { label: 'Burns', probability: 0.00 },
      { label: 'Cut', probability: 0.02 },
      { label: 'Diabetic Wounds', probability: 0.01 },
      { label: 'Laceration', probability: 0.01 },
      { label: 'Pressure Wounds', probability: 0.00 },
      { label: 'Venous Wounds', probability: 0.01 },
    ],
    ai_analysis: 'Incision site demonstrates normative primary intention closure. Epithelial bridge is intact with minimal peri-incisional erythema extending < 3mm from margin. No dehiscence, purulent exudate, or fluctuance detected.',
    recommendations: 'Maintain clean dry dressing protocol. Permitted to shower with waterproof barrier. Next photographic telemetry review scheduled in 24 hours.',
    tissue_metrics: {
      epithelial_rate: '+1.6 mm/day',
      erythema_radius: '2.8 mm (stable)',
      granulation_score: 92,
      staple_integrity: '14/14 intact & approximated',
      exudate_level: 'Serous Minimal',
    },
  },
];

const DEFAULT_VITALS: VitalRecord[] = [
  {
    id: 'vit-1',
    type: 'heart-rate',
    label: 'Resting Heart Rate',
    value: '68',
    unit: 'bpm',
    status: 'nominal',
    timestamp: '10m ago',
    history: [72, 70, 69, 74, 71, 68],
    normative: '60 – 100 bpm',
  },
  {
    id: 'vit-2',
    type: 'temperature',
    label: 'Core Body Temp',
    value: '98.6',
    unit: '°F',
    status: 'nominal',
    timestamp: '15m ago',
    history: [98.4, 98.7, 98.6, 98.9, 98.5, 98.6],
    normative: '97.8 – 99.1 °F',
  },
  {
    id: 'vit-3',
    type: 'incision-delta',
    label: 'Incision Thermal Delta',
    value: '+0.3',
    unit: '°F',
    status: 'nominal',
    timestamp: '20m ago',
    history: [0.6, 0.5, 0.4, 0.4, 0.3, 0.3],
    normative: '< +0.8 °F vs baseline',
  },
  {
    id: 'vit-4',
    type: 'oxygen',
    label: 'Oxygen Saturation (SpO2)',
    value: '99',
    unit: '%',
    status: 'nominal',
    timestamp: '10m ago',
    history: [98, 98, 99, 99, 98, 99],
    normative: '95 – 100%',
  },
  {
    id: 'vit-5',
    type: 'blood-pressure',
    label: 'Arterial Blood Pressure',
    value: '118/76',
    unit: 'mmHg',
    status: 'nominal',
    timestamp: '1h ago',
    history: [122, 120, 119, 121, 118, 118],
    normative: '90/60 – 120/80',
  },
];

const DEFAULT_MEDS: MedicationRecord[] = [
  {
    id: 'med-1',
    name: 'Amoxicillin-Clavulanate (Augmentin)',
    category: 'Antibiotic',
    dosage: '875 / 125 mg',
    frequency: 'Every 12 hours',
    scheduleSlot: 'Morning',
    completedToday: true,
    totalDays: 7,
    currentDay: 5,
    instructions: 'Take orally with food. Complete full 7-day course to prevent SSI.',
  },
  {
    id: 'med-2',
    name: 'Enoxaparin (Lovenox)',
    category: 'Anticoagulant',
    dosage: '40 mg / 0.4 mL',
    frequency: 'Once daily at 20:00',
    scheduleSlot: 'Evening',
    completedToday: false,
    totalDays: 10,
    currentDay: 6,
    instructions: 'Subcutaneous injection into anterolateral abdominal wall. DVT prophylaxis.',
  },
  {
    id: 'med-3',
    name: 'Celecoxib (Celebrex)',
    category: 'Anti-inflammatory',
    dosage: '200 mg',
    frequency: 'Every 24 hours',
    scheduleSlot: 'Morning',
    completedToday: true,
    totalDays: 14,
    currentDay: 6,
    instructions: 'Non-opioid multimodal analgesia. Take with full glass of water.',
  },
  {
    id: 'med-4',
    name: 'Acetaminophen (Tylenol ER)',
    category: 'Analgesic',
    dosage: '650 mg',
    frequency: 'Every 8 hours as needed',
    scheduleSlot: 'Afternoon',
    completedToday: false,
    totalDays: 10,
    currentDay: 6,
    instructions: 'Mild break-through discomfort. Do not exceed 3,000 mg in 24 hours.',
  },
];

const DEFAULT_MILESTONES: RecoveryMilestone[] = [
  { id: 'ms-1', label: 'Inspect surgical dressing & peri-wound skin', category: 'Wound Care', completed: true, dueTime: '08:00 AM' },
  { id: 'ms-2', label: 'Record morning core body temperature', category: 'Vitals', completed: true, dueTime: '08:30 AM' },
  { id: 'ms-3', label: 'Take Morning Antibiotic (Augmentin 875mg)', category: 'Vitals', completed: true, dueTime: '09:00 AM' },
  { id: 'ms-4', label: 'Complete Post-Op Ambulation (4,000 steps)', category: 'Mobility', completed: false, dueTime: '02:00 PM' },
  { id: 'ms-5', label: 'Log incision photo telemetry scan', category: 'Wound Care', completed: true, dueTime: '04:00 PM' },
  { id: 'ms-6', label: 'Administer Evening Enoxaparin injection', category: 'Vitals', completed: false, dueTime: '08:00 PM' },
];

export const RecoveryStore = {
  getPassport: (): PatientPassport => {
    if (typeof window === 'undefined') return DEFAULT_PASSPORT;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PASSPORT);
      return stored ? JSON.parse(stored) : DEFAULT_PASSPORT;
    } catch {
      return DEFAULT_PASSPORT;
    }
  },

  setPassport: (passport: PatientPassport) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PASSPORT, JSON.stringify(passport));
    window.dispatchEvent(new Event('healios-store-update'));
  },

  getAssessments: (): WoundAssessment[] => {
    if (typeof window === 'undefined') return DEFAULT_ASSESSMENTS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ASSESSMENTS;
    } catch {
      return DEFAULT_ASSESSMENTS;
    }
  },

  addAssessment: (assessment: WoundAssessment) => {
    if (typeof window === 'undefined') return;
    const current = RecoveryStore.getAssessments();
    const updated = [assessment, ...current];
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));
    // Also update legacy storage key for backward compatibility
    localStorage.setItem('wound_assessments', JSON.stringify(updated));
    window.dispatchEvent(new Event('healios-store-update'));
  },

  getVitals: (): VitalRecord[] => {
    if (typeof window === 'undefined') return DEFAULT_VITALS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VITALS);
      return stored ? JSON.parse(stored) : DEFAULT_VITALS;
    } catch {
      return DEFAULT_VITALS;
    }
  },

  addVital: (vital: Omit<VitalRecord, 'id' | 'timestamp' | 'history'>) => {
    if (typeof window === 'undefined') return;
    const current = RecoveryStore.getVitals();
    const existing = current.find((v) => v.type === vital.type);
    let updated: VitalRecord[];

    const numericVal = parseFloat(vital.value) || 70;

    if (existing) {
      updated = current.map((v) =>
        v.type === vital.type
          ? {
              ...v,
              value: vital.value,
              unit: vital.unit,
              status: vital.status,
              timestamp: 'Just now',
              history: [...v.history.slice(1), numericVal],
            }
          : v
      );
    } else {
      updated = [
        ...current,
        {
          id: `vit-${Date.now()}`,
          ...vital,
          timestamp: 'Just now',
          history: [numericVal, numericVal, numericVal, numericVal, numericVal, numericVal],
        },
      ];
    }

    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(updated));
    window.dispatchEvent(new Event('healios-store-update'));
  },

  getMedications: (): MedicationRecord[] => {
    if (typeof window === 'undefined') return DEFAULT_MEDS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
      return stored ? JSON.parse(stored) : DEFAULT_MEDS;
    } catch {
      return DEFAULT_MEDS;
    }
  },

  toggleMedication: (id: string) => {
    if (typeof window === 'undefined') return;
    const current = RecoveryStore.getMedications();
    const updated = current.map((m) => (m.id === id ? { ...m, completedToday: !m.completedToday } : m));
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('healios-store-update'));
  },

  addMedication: (newMed: Omit<MedicationRecord, 'id' | 'completedToday' | 'currentDay'>) => {
    if (typeof window === 'undefined') return;
    const current = RecoveryStore.getMedications();
    const updated: MedicationRecord[] = [
      ...current,
      {
        id: `med-${Date.now()}`,
        ...newMed,
        completedToday: false,
        currentDay: 1,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('healios-store-update'));
  },

  deleteMedication: (id: string) => {
    if (typeof window === 'undefined') return;
    const current = RecoveryStore.getMedications();
    const updated = current.filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(updated));
    window.dispatchEvent(new Event('healios-store-update'));
  },

  getMilestones: (): RecoveryMilestone[] => {
    if (typeof window === 'undefined') return DEFAULT_MILESTONES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MILESTONES);
      return stored ? JSON.parse(stored) : DEFAULT_MILESTONES;
    } catch {
      return DEFAULT_MILESTONES;
    }
  },

  toggleMilestone: (id: string) => {
    if (typeof window === 'undefined') return;
    const current = RecoveryStore.getMilestones();
    const updated = current.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
    localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(updated));
    window.dispatchEvent(new Event('healios-store-update'));
  },

  // Multimodal Risk Composite Algorithm
  calculateRecoveryIndex: () => {
    const assessments = RecoveryStore.getAssessments();
    const vitals = RecoveryStore.getVitals();
    const meds = RecoveryStore.getMedications();
    const milestones = RecoveryStore.getMilestones();

    // 1. Wound Vision Component (Weight: 45%)
    const latestAssessment = assessments[0];
    const woundRisk = latestAssessment ? latestAssessment.risk_score : 18;

    // 2. Vitals Stability Component (Weight: 25%)
    let vitalsPenalty = 0;
    const tempVital = vitals.find((v) => v.type === 'temperature');
    if (tempVital && parseFloat(tempVital.value) > 100.4) vitalsPenalty += 35; // Febrile
    const hrVital = vitals.find((v) => v.type === 'heart-rate');
    if (hrVital && parseFloat(hrVital.value) > 105) vitalsPenalty += 20; // Tachycardia
    const deltaVital = vitals.find((v) => v.type === 'incision-delta');
    if (deltaVital && parseFloat(deltaVital.value) > 1.2) vitalsPenalty += 25; // Local heat

    // 3. Medication Adherence Component (Weight: 15%)
    const completedMeds = meds.filter((m) => m.completedToday).length;
    const adherenceRate = meds.length > 0 ? completedMeds / meds.length : 1;
    const medPenalty = Math.round((1 - adherenceRate) * 20);

    // 4. Milestone Completion (Weight: 15%)
    const completedMilestones = milestones.filter((m) => m.completed).length;
    const milestoneRate = milestones.length > 0 ? completedMilestones / milestones.length : 1;
    const milestonePenalty = Math.round((1 - milestoneRate) * 15);

    // Total Composite Risk (0 to 100, where lower is safer)
    const compositeRisk = Math.min(
      100,
      Math.max(5, Math.round(woundRisk * 0.45 + vitalsPenalty * 0.25 + medPenalty + milestonePenalty))
    );

    let status: 'Nominal' | 'Guarded' | 'Critical' = 'Nominal';
    if (compositeRisk > 65) status = 'Critical';
    else if (compositeRisk > 28) status = 'Guarded';

    // Healing Progress Score (Inverse of Risk, 0 to 100)
    const healingProgress = Math.max(10, Math.min(98, 100 - compositeRisk + 8));

    return {
      compositeRisk,
      healingProgress,
      status,
      breakdown: {
        woundIntegrityScore: Math.max(0, 100 - woundRisk),
        vitalsStabilityScore: Math.max(0, 100 - vitalsPenalty),
        adherenceScore: Math.round(adherenceRate * 100),
        milestoneProgress: Math.round(milestoneRate * 100),
      },
    };
  },
};
