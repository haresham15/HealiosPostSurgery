'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, TrendingUp, Sparkles, Check } from 'lucide-react';

interface RecoveryArcProps {
  currentPOD: number;
  dischargeTargetPOD: number;
}

export const RecoveryArcTracker = ({
  currentPOD = 6,
  dischargeTargetPOD = 8,
}: RecoveryArcProps) => {
  const stages = [
    {
      pod: 'POD 0–1',
      title: 'Hemostasis & Infiltration',
      status: 'completed',
      milestone: 'Incision sealed; pain controlled via PCA',
    },
    {
      pod: 'POD 2–3',
      title: 'Inflammatory Clearance',
      status: 'completed',
      milestone: 'Bowel motility restored; liquid diet tolerated',
    },
    {
      pod: 'POD 4–6',
      title: 'Proliferative Bridging',
      status: 'current',
      milestone: 'Active epithelialization; ambulation target 4k steps',
    },
    {
      pod: 'POD 7–9',
      title: 'Discharge Readiness',
      status: 'upcoming',
      milestone: 'Target POD 8: Surgeon clearance & staple evaluation',
    },
    {
      pod: 'POD 10–14',
      title: 'Collagen Remodeling',
      status: 'upcoming',
      milestone: 'Tensile strength recovery; transition to scar care',
    },
  ];

  return (
    <Card className="border border-border/80 bg-card/70 backdrop-blur-md rounded-xl shadow-sm overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-border/70 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            ERAS Surgical Recovery Arc
          </CardTitle>
          <span className="text-xs font-semibold text-foreground mt-0.5 block">
            Enhanced Recovery After Surgery Protocol Trajectory
          </span>
        </div>

        <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30 bg-primary/10">
          Current: POD {currentPOD}
        </Badge>
      </CardHeader>

      <CardContent className="p-5">
        <div className="relative">
          {/* Connecting Track Line */}
          <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-border -z-0 sm:left-4" />

          <div className="space-y-4 relative z-10">
            {stages.map((stage, idx) => {
              const isCompleted = stage.status === 'completed';
              const isCurrent = stage.status === 'current';

              return (
                <div key={stage.pod} className="flex items-start gap-3.5 sm:gap-4 group">
                  {/* Step Node Icon */}
                  <div
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shrink-0 transition-all font-mono text-xs ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : isCurrent
                        ? 'bg-obsidian-900 border-2 border-primary text-primary shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse-glow'
                        : 'bg-muted border border-border text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    )}
                  </div>

                  {/* Stage Content Card */}
                  <div
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-primary/40 bg-primary/5 shadow-xs'
                        : 'border-border/50 bg-muted/20 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {stage.pod}
                        </span>
                        <span className="text-xs font-semibold text-foreground/90">
                          {stage.title}
                        </span>
                      </div>

                      {isCurrent && (
                        <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                          TODAY • ACTIVE STAGE
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Cleared
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {stage.milestone}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
