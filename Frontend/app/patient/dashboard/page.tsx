'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecoveryStore, WoundAssessment, VitalRecord } from '@/lib/recovery-store';
import { DailyChecklist } from '@/components/patient/DailyChecklist';
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
} from 'lucide-react';
import Image from 'next/image';

export default function PatientDashboard() {
  const [recoveryData, setRecoveryData] = useState<any>(null);
  const [latestAssessment, setLatestAssessment] = useState<WoundAssessment | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);

  const loadData = () => {
    setRecoveryData(RecoveryStore.calculateRecoveryIndex());
    const assessments = RecoveryStore.getAssessments();
    setLatestAssessment(assessments[0] || null);
    setVitals(RecoveryStore.getVitals());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healios-store-update', loadData);
    return () => window.removeEventListener('healios-store-update', loadData);
  }, []);

  if (!recoveryData) return null;

  const tempVital = vitals.find((v) => v.type === 'temperature');
  const hrVital = vitals.find((v) => v.type === 'heart-rate');

  return (
    <div className="space-y-6">
      {/* Friendly Reassurance Greeting */}
      <div className="p-6 rounded-2xl border border-border/80 bg-gradient-to-r from-card to-card/60 backdrop-blur-md shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Day 6 of Recovery
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Good morning, Eleanor
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Your healing is progressing smoothly. You have completed 3 of your daily recovery steps today.
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

      {/* Primary 2-Column Focus Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Wound Check Focus */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border border-border/80 bg-card/85 backdrop-blur-md rounded-2xl overflow-hidden shadow-xs">
            <CardHeader className="p-5 border-b border-border/70 flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Scan className="h-4 w-4 text-primary" />
                  Daily Wound Check
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Photo analysis & incision healing status
                </CardDescription>
              </div>

              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 bg-primary/10">
                Healthy Healing
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {latestAssessment ? (
                <div className="flex flex-col sm:flex-row items-start gap-4 p-3 rounded-xl bg-muted/25 border border-border">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden shrink-0 border border-border bg-black">
                    <Image
                      src={latestAssessment.image_url}
                      alt="Latest incision scan"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 text-xs">
                    <span className="font-bold text-sm text-foreground block">
                      Last Check: Today at 8:30 AM
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      "Incision looks clean and closed. No signs of infection or swelling."
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-primary font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" /> Normal inflammatory resolution
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
                    View History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Vitals Summary (Clean & Simple) */}
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
                  {tempVital?.value || '98.6'}°F
                </span>
                <span className="text-[10px] text-primary block mt-0.5 font-medium">Normal</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                <Heart className="h-4 w-4 text-clinical-rose mx-auto mb-1" />
                <span className="text-[11px] text-muted-foreground block">Heart Rate</span>
                <span className="text-lg font-bold text-foreground">
                  {hrVital?.value || '68'} <span className="text-xs font-normal">bpm</span>
                </span>
                <span className="text-[10px] text-primary block mt-0.5 font-medium">Resting</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/20 border border-border/60">
                <Activity className="h-4 w-4 text-secondary mx-auto mb-1" />
                <span className="text-[11px] text-muted-foreground block">Comfort</span>
                <span className="text-lg font-bold text-foreground">
                  2 <span className="text-xs font-normal">/ 10</span>
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

          {/* Calming Surgeon Note */}
          <Card className="border border-border/80 bg-card/85 backdrop-blur-md rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <span className="block font-bold">Dr. Arthur Campbell, MD</span>
                <span className="text-[11px] text-muted-foreground">Attending Surgeon • St. Jude Pavilion</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed p-3.5 rounded-xl bg-muted/25 border border-border">
              "Eleanor, your healing curve is right where we want it to be. Continue your daily 30-minute walks and remember to finish your full antibiotic course through Day 7."
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}