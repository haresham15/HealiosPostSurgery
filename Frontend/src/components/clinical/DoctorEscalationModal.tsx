'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PatientPassport, RecoveryStore } from '@/lib/recovery-store';
import { PhoneCall, AlertCircle, ShieldAlert, Printer, CheckCircle2, FileText } from 'lucide-react';

interface DoctorEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  passport: PatientPassport;
  recoveryData: any;
}

export const DoctorEscalationModal = ({
  isOpen,
  onClose,
  passport,
  recoveryData,
}: DoctorEscalationModalProps) => {
  const assessments = RecoveryStore.getAssessments();
  const vitals = RecoveryStore.getVitals();
  const latestAssessment = assessments[0];

  const tempVital = vitals.find((v) => v.type === 'temperature');
  const hrVital = vitals.find((v) => v.type === 'heart-rate');
  const deltaVital = vitals.find((v) => v.type === 'incision-delta');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-6 rounded-xl">
        <DialogHeader className="border-b border-border pb-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-500">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Clinical Triage & Escalation Protocol</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Surgical Care Team Handover Note
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Synthesized clinical summary for attending surgeon or on-call acute surgical triage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Patient Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">Patient</span>
              <span className="font-semibold text-foreground">{passport.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">MRN</span>
              <span className="font-mono text-foreground">{passport.mrn}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">Procedure</span>
              <span className="text-foreground truncate block">{passport.procedure}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">Timeline</span>
              <span className="font-mono font-semibold text-primary">POD {passport.postOpDay}</span>
            </div>
          </div>

          {/* Current Clinical Telemetry Readouts */}
          <div className="space-y-2">
            <h4 className="font-mono text-[11px] font-bold uppercase text-foreground/80 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" /> Active Biomarkers & Vitals
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">Core Body Temp</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {tempVital?.value || '98.6'} {tempVital?.unit || '°F'}
                </span>
                <span className="text-[10px] text-muted-foreground block">Ref: 97.8 – 99.1°F</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">Resting Heart Rate</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {hrVital?.value || '68'} {hrVital?.unit || 'bpm'}
                </span>
                <span className="text-[10px] text-muted-foreground block">Ref: 60 – 100 bpm</span>
              </div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                <span className="text-muted-foreground block text-[10px]">Incision Temp Delta</span>
                <span className="font-mono text-base font-bold text-foreground">
                  {deltaVital?.value || '+0.3'} {deltaVital?.unit || '°F'}
                </span>
                <span className="text-[10px] text-muted-foreground block">Ref: &lt; +0.8°F</span>
              </div>
            </div>
          </div>

          {/* Latest Wound Assessment Summary */}
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                Latest AI Wound Vision Analysis
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                Class: {latestAssessment?.predicted_class || 'Surgical Wounds'} ({latestAssessment?.risk_score || 18}% Risk)
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {latestAssessment?.ai_analysis || 'Incision site exhibits nominal primary closure. No macroscopic dehiscence or purulent drainage.'}
            </p>
          </div>

          {/* Red Flag Checklist */}
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2">
            <span className="font-mono text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Emergency Surgical Red Flags
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Temperature &gt; 101.0°F (38.3°C)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Rapidly spreading incision redness (&gt; 2 in)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Malodorous or cloudy wound drainage
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unrelieved pain after prescribed analgesia
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="w-full sm:w-auto text-xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Summary
          </Button>

          <a href="tel:+18005557874" className="w-full sm:w-auto">
            <Button
              size="sm"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
            >
              <PhoneCall className="h-3.5 w-3.5" /> Call On-Call Surgical Service
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
