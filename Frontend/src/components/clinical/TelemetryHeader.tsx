'use client';

import { useState, useEffect } from 'react';
import { RecoveryStore, PatientPassport } from '@/lib/recovery-store';
import { ShieldCheck, Activity, PhoneCall, FileDown, Clock, Stethoscope, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoctorEscalationModal } from './DoctorEscalationModal';

export const TelemetryHeader = () => {
  const [passport, setPassport] = useState<PatientPassport | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);

  const loadData = () => {
    setPassport(RecoveryStore.getPassport());
    setRecoveryData(RecoveryStore.calculateRecoveryIndex());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healios-store-update', loadData);
    return () => window.removeEventListener('healios-store-update', loadData);
  }, []);

  if (!passport) return null;

  const isGuarded = recoveryData?.status === 'Guarded';
  const isCritical = recoveryData?.status === 'Critical';

  return (
    <>
      <div className="w-full bg-card/70 backdrop-blur-md border-b border-border/80 text-foreground px-4 py-3 sm:px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Patient Core Identifier */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/25">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">{passport.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  MRN {passport.mrn}
                </span>
                <span className="text-xs text-muted-foreground">
                  {passport.age}Y • {passport.gender}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 ${
                    isCritical
                      ? 'border-red-500/50 text-red-400 bg-red-950/20'
                      : isGuarded
                      ? 'border-amber-500/50 text-amber-400 bg-amber-950/20'
                      : 'border-primary/40 text-primary bg-primary/10'
                  }`}
                >
                  {isCritical ? 'ALERT: Triage Flag' : isGuarded ? 'Watch: Mild Deviation' : 'Nominal Healing Arc'}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2">
                <span className="font-medium text-foreground/90">{passport.procedure}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{passport.attendingSurgeon}</span>
              </p>
            </div>
          </div>

          {/* Center: Real-time Recovery Phase & Telemetry Status */}
          <div className="flex items-center gap-4 bg-muted/40 dark:bg-obsidian-900/60 px-3.5 py-1.5 rounded-lg border border-border/70 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block leading-tight">Timeline</span>
                <span className="font-semibold font-mono text-foreground">
                  POD {passport.postOpDay} <span className="text-muted-foreground font-normal">/ Target POD {passport.dischargeTargetPOD}</span>
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-border/80" />

            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-secondary" />
              <div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground block leading-tight">Stage</span>
                <span className="font-medium text-foreground">{passport.healingStage}</span>
              </div>
            </div>
          </div>

          {/* Right: Rapid Clinical Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEscalation(true)}
              className="h-8 gap-1.5 text-xs font-medium border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Surgeon Triage</span>
            </Button>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-8 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Export Telemetry</span>
            </Button>
          </div>
        </div>
      </div>

      <DoctorEscalationModal
        isOpen={showEscalation}
        onClose={() => setShowEscalation(false)}
        passport={passport}
        recoveryData={recoveryData}
      />
    </>
  );
};
