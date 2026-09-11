'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, AlertCircle, Activity, CheckCircle2 } from 'lucide-react';

interface RiskScoreDisplayProps {
  score: number;
  status: 'Healthy' | 'At-Risk' | 'Critical';
}

export const RiskScoreDisplay = ({ score, status }: RiskScoreDisplayProps) => {
  const isHealthy = status === 'Healthy';
  const isAtRisk = status === 'At-Risk';
  const isCritical = status === 'Critical';

  return (
    <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl overflow-hidden shadow-sm">
      <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Incision Site Healing Telemetry
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Current neural classification score & inflammatory risk status
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className={`font-mono text-xs uppercase px-2.5 py-0.5 ${
            isCritical
              ? 'border-red-500/40 text-red-400 bg-red-950/20'
              : isAtRisk
              ? 'border-amber-500/40 text-amber-400 bg-amber-950/20'
              : 'border-primary/40 text-primary bg-primary/10'
          }`}
        >
          {status}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-muted-foreground block">
              Complication Risk Probability
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-3xl font-black text-foreground tnum">{score}%</span>
              <span className="text-xs text-muted-foreground font-mono">
                {score < 30 ? 'Low Risk Band' : score < 60 ? 'Moderate Caution' : 'High Alert Band'}
              </span>
            </div>
          </div>

          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted/40 border border-border">
            {isHealthy && <CheckCircle2 className="h-6 w-6 text-primary" />}
            {isAtRisk && <AlertTriangle className="h-6 w-6 text-amber-500" />}
            {isCritical && <AlertCircle className="h-6 w-6 text-red-500" />}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isHealthy ? 'bg-primary' : isAtRisk ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isHealthy &&
              'Epithelialization is advancing on schedule with standard inflammatory resolution. Continue normal recovery activities.'}
            {isAtRisk &&
              'Mild erythema or thermal deviation noted. Monitor for progressive margin expansion or elevation in pain score.'}
            {isCritical &&
              'Incision indicators deviate from expected ERAS parameters. Surgical team review recommended.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
