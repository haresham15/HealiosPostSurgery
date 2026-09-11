'use client';

import { useState } from 'react';
import { WoundUpload } from '@/components/dashboard/WoundUpload';
import { AssessmentHistory } from '@/components/dashboard/AssessmentHistory';
import { Badge } from '@/components/ui/badge';
import { Scan, Sparkles, Camera, ShieldCheck, Info } from 'lucide-react';

export default function WoundCheckPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAnalysisComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/30 bg-primary/10">
              Computer Vision Telemetry
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">10-Class Deep Learning</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Incision Telemetry Workstation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Upload daily incision photographs for automated tissue margin segmentation, erythema measurement, and before-and-after baseline tracking.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border">
          <Info className="h-4 w-4 text-secondary" />
          <span>Focal Distance: 15–20 cm • 90° Angle</span>
        </div>
      </div>

      {/* Main Grid: Upload Scanner & Historical Archive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <WoundUpload onAnalysisComplete={handleAnalysisComplete} />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <AssessmentHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
