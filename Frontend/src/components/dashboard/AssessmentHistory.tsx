'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, CheckCircle2, AlertTriangle, AlertCircle, Calendar, Eye, Activity } from 'lucide-react';
import { RecoveryStore, WoundAssessment } from '@/lib/recovery-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DualLensWoundViewer } from '@/components/clinical/DualLensWoundViewer';
import { ProbabilityMatrix } from '@/components/clinical/ProbabilityMatrix';

interface AssessmentHistoryProps {
  refreshTrigger: number;
}

export const AssessmentHistory = ({ refreshTrigger }: AssessmentHistoryProps) => {
  const [assessments, setAssessments] = useState<WoundAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<WoundAssessment | null>(null);

  const loadAssessments = () => {
    const list = RecoveryStore.getAssessments();
    setAssessments(list);
  };

  useEffect(() => {
    loadAssessments();
    window.addEventListener('healios-store-update', loadAssessments);
    return () => window.removeEventListener('healios-store-update', loadAssessments);
  }, [refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] font-mono uppercase">
            Nominal
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-950/20 text-[10px] font-mono uppercase">
            Watch
          </Badge>
        );
      case 'critical':
      default:
        return (
          <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-950/20 text-[10px] font-mono uppercase">
            Alert
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl overflow-hidden shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Incision Telemetry Archive
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Chronological log of surgical site computer vision assessments ({assessments.length} scans)
            </CardDescription>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">
            POD 0 → TODAY
          </span>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {assessments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No telemetry scans recorded</p>
              <p className="text-xs mt-1">Upload a wound image to start your recovery history.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {assessments.map((item, idx) => {
                const dateObj = new Date(item.created_at);
                const formattedDate = isNaN(dateObj.getTime())
                  ? 'Recent'
                  : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const formattedTime = isNaN(dateObj.getTime())
                  ? ''
                  : dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl border border-border/60 bg-muted/15 hover:bg-muted/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                  >
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0 border border-border bg-black">
                        <Image
                          src={item.image_url}
                          alt="Wound scan thumbnail"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {item.predicted_class}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>

                        <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                          {item.ai_analysis}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-primary" />
                            {formattedDate} {formattedTime}
                          </span>
                          <span>•</span>
                          <span>Risk: {item.risk_score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action to open Dual Lens */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAssessment(item)}
                      className="w-full sm:w-auto h-8 text-xs font-mono gap-1.5 border-border hover:border-primary/40 hover:text-primary shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect Lens
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Detailed Inspection Modal */}
      {selectedAssessment && (
        <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
          <DialogContent className="max-w-3xl bg-card border-border shadow-2xl p-6 rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-primary">
                  Historical Telemetry Inspection
                </span>
                {getStatusBadge(selectedAssessment.status)}
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Incision Morphology: {selectedAssessment.predicted_class}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Recorded on {new Date(selectedAssessment.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <DualLensWoundViewer
                currentUrl={selectedAssessment.image_url}
                baselineUrl={selectedAssessment.baseline_url}
                predictedClass={selectedAssessment.predicted_class}
                tissueMetrics={selectedAssessment.tissue_metrics}
              />

              <div className="p-3.5 rounded-lg border border-border bg-muted/20 text-xs space-y-1.5">
                <span className="font-mono text-[10px] font-bold uppercase text-primary block">
                  Diagnosis & Protocol Directives
                </span>
                <p className="text-foreground leading-relaxed">{selectedAssessment.ai_analysis}</p>
                <p className="text-muted-foreground leading-relaxed">{selectedAssessment.recommendations}</p>
              </div>

              {selectedAssessment.probabilities && (
                <ProbabilityMatrix
                  probabilities={selectedAssessment.probabilities}
                  predictedClass={selectedAssessment.predicted_class}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};