'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

interface MultimodalGaugeProps {
  compositeRisk: number;
  healingProgress: number;
  status: 'Nominal' | 'Guarded' | 'Critical';
  breakdown: {
    woundIntegrityScore: number;
    vitalsStabilityScore: number;
    adherenceScore: number;
    milestoneProgress: number;
  };
}

export const MultimodalRiskGauge = ({
  compositeRisk,
  healingProgress,
  status,
  breakdown,
}: MultimodalGaugeProps) => {
  const [viewMode, setViewMode] = useState<'risk' | 'healing'>('healing');

  const isNominal = status === 'Nominal';
  const isGuarded = status === 'Guarded';
  const isCritical = status === 'Critical';

  // SVG Circular Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const activeValue = viewMode === 'healing' ? healingProgress : compositeRisk;
  const strokeDashoffset = circumference - (activeValue / 100) * circumference;

  const strokeColor = viewMode === 'healing'
    ? 'text-primary'
    : isCritical
    ? 'text-red-500'
    : isGuarded
    ? 'text-amber-500'
    : 'text-primary';

  return (
    <Card className="border border-border/80 bg-card/70 backdrop-blur-md rounded-xl overflow-hidden shadow-sm">
      <CardHeader className="p-4 pb-2 border-b border-border/70 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Multimodal Recovery Composite Index
          </CardTitle>
          <span className="text-xs font-semibold text-foreground mt-0.5 block">
            Synthesized AI Vision & Physiological Telemetry
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex rounded-md border border-border p-0.5 bg-muted/30 text-[10px] font-mono">
          <button
            onClick={() => setViewMode('healing')}
            className={`px-2 py-0.5 rounded ${
              viewMode === 'healing' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'
            }`}
          >
            Healing Arc
          </button>
          <button
            onClick={() => setViewMode('risk')}
            className={`px-2 py-0.5 rounded ${
              viewMode === 'risk' ? 'bg-card text-foreground font-bold shadow-xs' : 'text-muted-foreground'
            }`}
          >
            Risk Score
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular Telemetry Dial */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background Track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                className="text-muted/30"
                fill="transparent"
              />
              {/* Active Value Arc */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${strokeColor} transition-all duration-1000 ease-out`}
                fill="transparent"
              />
            </svg>

            {/* Dial Center Data */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-mono text-3xl font-black tracking-tight text-foreground tnum">
                {activeValue}%
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {viewMode === 'healing' ? 'Nominal Arc' : 'Surgical Risk'}
              </span>
              <Badge
                variant="outline"
                className={`mt-1 text-[9px] font-mono uppercase px-1.5 py-0 ${
                  isCritical
                    ? 'text-red-400 border-red-500/30 bg-red-950/20'
                    : isGuarded
                    ? 'text-amber-400 border-amber-500/30 bg-amber-950/20'
                    : 'text-primary border-primary/30 bg-primary/10'
                }`}
              >
                {status}
              </Badge>
            </div>
          </div>

          {/* 4 Vector Sub-Meters */}
          <div className="flex-1 w-full space-y-3 text-xs">
            {/* Vector 1: Wound AI Integrity */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground font-mono text-[11px]">Wound Vision Integrity</span>
                <span className="font-mono font-bold text-foreground tnum">{breakdown.woundIntegrityScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${breakdown.woundIntegrityScore}%` }}
                />
              </div>
            </div>

            {/* Vector 2: Vitals & Thermal Stability */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground font-mono text-[11px]">Core Vitals Stability</span>
                <span className="font-mono font-bold text-secondary tnum">{breakdown.vitalsStabilityScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500"
                  style={{ width: `${breakdown.vitalsStabilityScore}%` }}
                />
              </div>
            </div>

            {/* Vector 3: Medication Adherence */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground font-mono text-[11px]">Medication Adherence</span>
                <span className="font-mono font-bold text-foreground tnum">{breakdown.adherenceScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-clinical-amber rounded-full transition-all duration-500"
                  style={{ width: `${breakdown.adherenceScore}%` }}
                />
              </div>
            </div>

            {/* Vector 4: Milestone Progress */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground font-mono text-[11px]">ERAS Milestones Completed</span>
                <span className="font-mono font-bold text-foreground tnum">{breakdown.milestoneProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full transition-all duration-500"
                  style={{ width: `${breakdown.milestoneProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
