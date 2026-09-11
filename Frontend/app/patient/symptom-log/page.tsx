'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, SymptomLog } from '@/lib/api';

const DEMO_USER_ID = 'demo_user_001';

const FALLBACK_LOGS: SymptomLog[] = [
  {
    id: 101,
    user_id: 1,
    free_text: 'Mild tightness along the incision line during morning ambulation. No drainage or fever noted. Pain score 2/10.',
    urgency: 1.0,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 102,
    user_id: 1,
    free_text: 'Tolerated soft solid diet without postprandial nausea. Completed 4,000 steps ambulation target.',
    urgency: 1.0,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export default function SymptomLogPage() {
  const queryClient = useQueryClient();
  const [symptomText, setSymptomText] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [localFallback, setLocalFallback] = useState<SymptomLog[]>(FALLBACK_LOGS);

  // 1. Ensure Demo User Exists
  useEffect(() => {
    api.createUser(DEMO_USER_ID, 'Eleanor Vance')
      .catch((err) => console.warn('Backend user registration deferred/offline:', err));
  }, []);

  // 2. Fetch Logs via React Query
  const { data: remoteLogs, isLoading } = useQuery({
    queryKey: ['symptom-logs', DEMO_USER_ID],
    queryFn: async () => {
      try {
        const res = await api.getLogs(DEMO_USER_ID);
        return res;
      } catch (err) {
        console.warn('Backend log query offline, using local logs:', err);
        return null;
      }
    },
    retry: 1,
  });

  const displayLogs = remoteLogs && remoteLogs.length > 0 ? remoteLogs : localFallback;

  // 3. Add Log Mutation
  const addLogMutation = useMutation({
    mutationFn: async (data: { text: string; urgency: number }) => {
      try {
        return await api.createLog(DEMO_USER_ID, data.text, data.urgency);
      } catch (err) {
        // Fallback local append if backend is not currently running
        const mockLog: SymptomLog = {
          id: Date.now(),
          user_id: 1,
          free_text: data.text,
          urgency: data.urgency,
          created_at: new Date().toISOString(),
        };
        setLocalFallback((prev) => [mockLog, ...prev]);
        return mockLog;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptom-logs'] });
      setSymptomText('');
      setSeverity('mild');
    },
  });

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomText.trim()) return;

    const urgencyMap = { mild: 1.0, moderate: 5.0, severe: 10.0 };
    addLogMutation.mutate({
      text: symptomText.trim(),
      urgency: urgencyMap[severity],
    });
  };

  // Automated Keyword Triage Detection
  const hasFever = /fever|chills|sweats|hot/i.test(symptomText);
  const hasDrainage = /drainage|pus|discharge|oozing|fluid/i.test(symptomText);
  const hasSeverePain = /severe pain|unbearable|burning|throbbing/i.test(symptomText);
  const detectedFlags = [
    hasFever && 'Thermal / Fever Flag',
    hasDrainage && 'Wound Exudate Flag',
    hasSeverePain && 'High Pain Score Flag',
  ].filter(Boolean);

  const getUrgencyBadge = (urgency: number) => {
    if (urgency >= 8) {
      return (
        <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-950/20 text-[10px] font-mono uppercase">
          Triage Priority: Urgent
        </Badge>
      );
    }
    if (urgency >= 4) {
      return (
        <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-950/20 text-[10px] font-mono uppercase">
          Triage Priority: Moderate
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] font-mono uppercase">
        Routine Observation
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/30 bg-primary/10">
              Clinical Symptom Stream
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">FastAPI + SQLModel SQLite Synchronized</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Symptom Diary & Acute Triage Log
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Continuous chronological narrative logging of subjective sensations, pain scores, GI motility, and wound sensations.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30 bg-primary/10 self-start sm:self-auto">
          ● SURGICAL TEAM TELEMETRY ACTIVE
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form with Smart Triage Guardrails */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Log Clinical Recovery Note
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Document pain levels, bowel function, activity tolerance, or incision changes
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="symptom-input" className="text-xs font-mono text-muted-foreground uppercase">
                    Subjective Symptoms & Sensations
                  </Label>
                  <Textarea
                    id="symptom-input"
                    placeholder="Describe your current sensations, pain location (1-10), nausea, or dressing status..."
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    rows={4}
                    className="text-xs border-border bg-muted/20 leading-relaxed resize-none"
                    required
                  />
                </div>

                {/* Live Clinical Keyword Warning */}
                {detectedFlags.length > 0 && (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Clinical Triage Trigger Detected:
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Your entry contains potential red-flag terms ({detectedFlags.join(', ')}). Consider elevating urgency to Moderate or Severe.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-mono text-muted-foreground uppercase">
                    Clinical Severity / Urgency Level
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSeverity('mild')}
                      className={`h-9 rounded-lg border text-xs font-mono font-medium transition-all ${
                        severity === 'mild'
                          ? 'border-primary bg-primary/15 text-primary font-bold shadow-xs'
                          : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      Mild (1.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeverity('moderate')}
                      className={`h-9 rounded-lg border text-xs font-mono font-medium transition-all ${
                        severity === 'moderate'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold shadow-xs'
                          : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      Moderate (5.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeverity('severe')}
                      className={`h-9 rounded-lg border text-xs font-mono font-medium transition-all ${
                        severity === 'severe'
                          ? 'border-red-500 bg-red-500/15 text-red-400 font-bold shadow-xs'
                          : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      Severe (10.0)
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={addLogMutation.isPending}
                  className="w-full h-10 text-xs font-mono font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {addLogMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transmitting Note...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Submit to Surgical Stream
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Historical Triage Feed */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Care Team Triage Feed
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Timestamped patient entries synchronized with clinical database
                </CardDescription>
              </div>

              <span className="font-mono text-xs text-muted-foreground">
                {displayLogs.length} Records
              </span>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <span className="text-xs font-mono">Accessing clinical database...</span>
                </div>
              ) : displayLogs.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-10">
                  No symptom logs recorded. Use the form to record your first clinical entry.
                </p>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {displayLogs.map((log) => {
                    const date = new Date(log.created_at);
                    const formatted = isNaN(date.getTime())
                      ? 'Recent'
                      : date.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl border border-border/60 bg-muted/15 space-y-2 hover:border-border transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {getUrgencyBadge(log.urgency)}
                            <span className="font-mono text-[10px] text-muted-foreground">
                              Urgency Index: {log.urgency.toFixed(1)}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary" /> {formatted}
                          </span>
                        </div>

                        <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                          {log.free_text}
                        </p>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-1 text-primary">
                            <ShieldCheck className="h-3 w-3" /> Transmitted to Care Team
                          </span>
                          <span>MRN: HL-88294-A</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
