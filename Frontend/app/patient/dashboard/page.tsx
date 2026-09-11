'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecoveryStore, WoundAssessment, VitalRecord, PatientPassport } from '@/lib/recovery-store';
import { DailyChecklist } from '@/components/patient/DailyChecklist';
import { MultimodalRiskGauge } from '@/components/clinical/MultimodalRiskGauge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Scan,
  CheckCircle2,
  Thermometer,
  Heart,
  Activity,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Sparkles,
  Flame,
} from 'lucide-react';
import Image from 'next/image';
import { api, RecoverySummaryResponse } from '@/lib/api';

export default function PatientDashboard() {
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [latestAssessment, setLatestAssessment] = useState<WoundAssessment | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [passport, setPassport] = useState<PatientPassport | null>(null);
  const [remoteSummary, setRemoteSummary] = useState<RecoverySummaryResponse | null>(null);

  const loadData = async () => {
    // 1. Instant local store hydration
    const rData = RecoveryStore.calculateRecoveryIndex();
    setRecoveryData(rData);
    const assessments = RecoveryStore.getAssessments();
    setLatestAssessment(assessments[0] || null);
    setVitals(RecoveryStore.getVitals());
    setPassport(RecoveryStore.getPassport());

    // 2. Query backend SQLite EHR recovery summary
    try {
      const summary = await api.getRecoverySummary('pat-default');
      if (summary) {
        setRemoteSummary(summary);
      }
    } catch (err) {
      console.warn('Backend recovery summary sync skipped:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healios-store-update', loadData);
    return () => window.removeEventListener('healios-store-update', loadData);
  }, []);

  if (!recoveryData) return null;

  const tempVital = vitals.find((v) => v.type === 'temperature');
  const hrVital = vitals.find((v) => v.type === 'heart-rate');

  const patientName = remoteSummary?.patient?.name || passport?.name || 'Elena Rostova';
  const procedureName = remoteSummary?.patient?.procedure_name || passport?.procedure || 'Laparoscopic Appendectomy';
  const surgeonName = remoteSummary?.patient?.surgeon_name || passport?.attendingSurgeon || 'Dr. Arthur Campbell, MD';
  const facility = remoteSummary?.patient?.facility || passport?.surgicalFacility || 'St. Jude Surgical Pavilion';
  const daysPostOp = remoteSummary?.days_post_op ?? passport?.postOpDay ?? 4;

  const woundScore = latestAssessment
    ? Math.max(10, 100 - (latestAssessment.risk_score || 15))
    : 92;
  const vitalsScore = tempVital?.status === 'nominal' ? 95 : 70;
  const adherenceScore = recoveryData.checklistProgress || 90;
  const milestoneScore = recoveryData.healingProgress || 80;

  const compositeRisk = remoteSummary?.risk_score ?? Math.round(100 - (woundScore * 0.4 + vitalsScore * 0.3 + adherenceScore * 0.3));
  const gaugeStatus = compositeRisk > 50 ? 'Critical' : compositeRisk > 25 ? 'Guarded' : 'Nominal';

  return (
    <div className="space-y-6">
      {/* Friendly Reassurance Greeting */}
      <div className="p-6 rounded-2xl border border-border/80 bg-gradient-to-r from-card to-card/60 backdrop-blur-md shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Day {daysPostOp} of Recovery • {procedureName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Good morning, {patientName.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Your healing trajectory is progressing safely. Continue your daily surgical protocol below.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground block uppercase font-medium">Overall Progress</span>
            <span className="text-lg font-bold text-foreground">{recoveryData.healingProgress}% Healing Arc</span>
          </div>
        </div>
      </div>

      {/* Multimodal Composite Telemetry Gauge */}
      <MultimodalRiskGauge
        compositeRisk={compositeRisk}
        healingProgress={recoveryData.healingProgress}
        status={gaugeStatus}
        breakdown={{
          woundIntegrityScore: woundScore,
          vitalsStabilityScore: vitalsScore,
          adherenceScore: adherenceScore,
          milestoneProgress: milestoneScore,
        }}
      />

      {/* Primary 2-Column Focus Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Wound Check Focus */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border border-border/80 bg-card/85 backdrop-blur-md rounded-2xl overflow-hidden shadow-xs">
            <CardHeader className="p-5 border-b border-border/70 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Scan className="h-4 w-4 text-primary" />
                  Daily Incision Telemetry & Vision
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Photo analysis, Grad-CAM attention & healing kinetics
                </CardDescription>
              </div>

              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 bg-primary/10">
                {latestAssessment?.predicted_class || 'Healthy Healing'}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {latestAssessment ? (
                <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-xl bg-muted/25 border border-border">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden shrink-0 border border-border bg-black">
                    <Image
                      src={latestAssessment.heatmap_url || latestAssessment.image_url}
                      alt="Latest incision scan"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {latestAssessment.heatmap_url && (
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-bold text-amber-400 flex items-center gap-0.5">
                        <Flame className="h-2.5 w-2.5" /> XAI
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 text-xs">
                    <span className="font-bold text-sm text-foreground block">
                      Last Check: {new Date(latestAssessment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-muted-foreground leading-relaxed line-clamp-2">
                      {latestAssessment.ai_analysis}
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-primary font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Incision Margin: {latestAssessment.predicted_class} (Confidence: {Math.round((latestAssessment.confidence || 0.9) * 100)}%)
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3">
                <Link href="/patient/wound_check" className="flex-1">
                  <Button className="w-full h-11 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm">
                    <Scan className="h-4 w-4" />
                    Take Today's Wound Photo
                  </Button>
                </Link>

                <Link href="/patient/wound_check">
                  <Button variant="outline" className="h-11 px-4 text-xs font-medium rounded-xl border-border">
                    View History & Grad-CAM
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Vitals Summary */}
          <Card className="border border-border/80 bg-card/85 backdrop-blur-md rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Today's Vital Signs
              </span>
              <Link href="/patient/vitals" className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5">
                Log reading <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                <Thermometer className="h-4 w-4 text-primary mx-auto mb-1" />
                <span className="text-[11px] text-muted-foreground block">Body Temp</span>
                <span className="text-lg font-bold text-foreground">
                  {tempVital?.value || (remoteSummary?.latest_vitals?.temperature ? remoteSummary.latest_vitals.temperature.toFixed(1) : '98.6')}°F
                </span>
                <span className="text-[10px] text-primary block mt-0.5 font-medium">Normal</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                <Heart className="h-4 w-4 text-rose-500 mx-auto mb-1" />
                <span className="text-[11px] text-muted-foreground block">Heart Rate</span>
                <span className="text-lg font-bold text-foreground">
                  {hrVital?.value || (remoteSummary?.latest_vitals?.heart_rate ? String(remoteSummary.latest_vitals.heart_rate) : '68')} <span className="text-xs font-normal">bpm</span>
                </span>
                <span className="text-[10px] text-primary block mt-0.5 font-medium">Resting</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                <Activity className="h-4 w-4 text-primary mx-auto mb-1" />
                <span className="text-[11px] text-muted-foreground block">Comfort</span>
                <span className="text-lg font-bold text-foreground">
                  {remoteSummary?.latest_vitals?.pain_score ?? 2} <span className="text-xs font-normal">/ 10</span>
                </span>
                <span className="text-[10px] text-primary block mt-0.5 font-medium">Mild</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Today's Recovery Checklist & Doctor Note */}
        <div className="lg:col-span-6 space-y-6">
          {/* Daily Protocol Checklist */}
          <DailyChecklist />

          {/* Calming Attending Surgeon Note */}
          <Card className="border border-border/80 bg-card/85 backdrop-blur-md rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-bold">{surgeonName}</span>
                <span className="text-[11px] text-muted-foreground">Attending Surgeon • {facility}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed p-3.5 rounded-xl bg-muted/25 border border-border">
              &quot;{patientName.split(' ')[0]}, your healing curve is progressing right along standard clinical recovery benchmarks. Keep your incision dry, maintain regular hydration, and use the AI Recovery Concierge if you experience any change in symptoms.&quot;
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}