'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface ProbabilityItem {
  label: string;
  probability: number;
}

interface ProbabilityMatrixProps {
  probabilities: ProbabilityItem[];
  predictedClass: string;
}

export const ProbabilityMatrix = ({ probabilities, predictedClass }: ProbabilityMatrixProps) => {
  // Sort descending by probability
  const sorted = [...probabilities].sort((a, b) => b.probability - a.probability);

  const getRiskCategory = (label: string) => {
    switch (label) {
      case 'Normal':
      case 'Surgical Wounds':
        return { tier: 'Expected Healing', color: 'text-primary border-primary/30 bg-primary/10', bar: 'bg-primary' };
      case 'Cut':
      case 'Laceration':
      case 'Abrasions':
      case 'Bruises':
        return { tier: 'Superficial / Minor', color: 'text-amber-500 border-amber-500/30 bg-amber-500/10', bar: 'bg-amber-500' };
      case 'Diabetic Wounds':
      case 'Pressure Wounds':
      case 'Venous Wounds':
      case 'Burns':
      default:
        return { tier: 'High-Risk Pathology', color: 'text-red-400 border-red-500/30 bg-red-950/20', bar: 'bg-red-500' };
    }
  };

  return (
    <Card className="border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="p-4 pb-3 border-b border-border/70 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            10-Class Neural Multiclass Spectrum
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            TensorFlow deep-learning classifier probabilities across all diagnostic classes
          </p>
        </div>
        <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">
          Top: {predictedClass}
        </span>
      </CardHeader>

      <CardContent className="p-4 pt-3 space-y-2.5">
        {sorted.map((item) => {
          const percentage = Math.round(item.probability * 1000) / 10;
          const isTop = item.label.toLowerCase() === predictedClass.toLowerCase();
          const category = getRiskCategory(item.label);

          return (
            <div
              key={item.label}
              className={`p-2 rounded-lg border transition-all ${
                isTop
                  ? 'border-primary/40 bg-primary/5 shadow-xs'
                  : 'border-border/40 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isTop ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {item.label}
                  </span>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 uppercase font-mono ${category.color}`}>
                    {category.tier}
                  </Badge>
                  {isTop && (
                    <span className="text-[10px] font-mono font-bold text-primary flex items-center gap-0.5">
                      ★ PREDICTED
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs font-semibold text-foreground tnum">
                  {percentage.toFixed(1)}%
                </span>
              </div>

              {/* High-Precision Spectrum Bar */}
              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isTop ? 'bg-primary' : category.bar + ' opacity-70'
                  }`}
                  style={{ width: `${Math.max(2, percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
