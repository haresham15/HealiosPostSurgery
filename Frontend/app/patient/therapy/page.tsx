'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus, Trash2, Footprints, Wind, Activity, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

interface TherapySession {
  id: string;
  type: string;
  duration: number;
  date: string;
  painBefore: number;
  painAfter: number;
  notes: string;
}

export default function TherapyPage() {
  const [sessions, setSessions] = useState<TherapySession[]>([
    {
      id: '1',
      type: 'Early ERAS Ambulation Walk',
      duration: 25,
      date: 'Today, 09:30 AM',
      painBefore: 3,
      painAfter: 2,
      notes: 'Completed hallway loop 3 times. Good respiratory stability, no dizziness.',
    },
    {
      id: '2',
      type: 'Incentive Spirometry & Pulmonary Toilet',
      duration: 15,
      date: 'Yesterday, 04:00 PM',
      painBefore: 2,
      painAfter: 2,
      notes: 'Reached 1,500 mL volume target x 10 breaths. Clear bilateral breath sounds.',
    },
  ]);

  const [newSession, setNewSession] = useState({
    type: 'Early ERAS Ambulation Walk',
    duration: '20',
    painBefore: '3',
    painAfter: '2',
    notes: '',
  });

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.type || !newSession.duration) return;

    setSessions([
      {
        id: Date.now().toString(),
        type: newSession.type,
        duration: parseInt(newSession.duration) || 20,
        date: 'Just now',
        painBefore: parseInt(newSession.painBefore) || 0,
        painAfter: parseInt(newSession.painAfter) || 0,
        notes: newSession.notes || 'Routine protocol rehabilitation session completed.',
      },
      ...sessions,
    ]);

    setNewSession({
      type: 'Early ERAS Ambulation Walk',
      duration: '20',
      painBefore: '3',
      painAfter: '2',
      notes: '',
    });
  };

  const removeSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/30 bg-primary/10">
              Functional Rehabilitation
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">ERAS Mobility Targets</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Rehabilitation & Pulmonary Therapy
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Early mobilization and deep breathing exercise tracking to prevent atelectasis and venous thromboembolism.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-muted/40 px-3.5 py-2 rounded-lg border border-border text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">Daily Ambulation</span>
            <span className="font-bold text-primary tnum">3,450 / 4,000 Steps</span>
          </div>
        </div>
      </div>

      {/* Mobility Target Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/70 bg-card/75 backdrop-blur-sm p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-mono text-[11px] uppercase flex items-center gap-1.5">
              <Footprints className="h-3.5 w-3.5 text-primary" /> Daily Ambulation
            </span>
            <span className="font-mono text-[10px] text-primary">86% Goal</span>
          </div>
          <span className="font-mono text-2xl font-bold text-foreground">3,450</span>
          <span className="text-xs text-muted-foreground font-mono ml-1">steps today</span>
          <div className="h-1.5 w-full bg-muted/40 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '86%' }} />
          </div>
        </Card>

        <Card className="border border-border/70 bg-card/75 backdrop-blur-sm p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-mono text-[11px] uppercase flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 text-secondary" /> Spirometry Volume
            </span>
            <span className="font-mono text-[10px] text-secondary">Target Met</span>
          </div>
          <span className="font-mono text-2xl font-bold text-foreground">1,500</span>
          <span className="text-xs text-muted-foreground font-mono ml-1">mL target</span>
          <div className="h-1.5 w-full bg-muted/40 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: '100%' }} />
          </div>
        </Card>

        <Card className="border border-border/70 bg-card/75 backdrop-blur-sm p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-mono text-[11px] uppercase flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-clinical-amber" /> Exercise Pain Delta
            </span>
            <span className="font-mono text-[10px] text-clinical-amber">-1.0 avg</span>
          </div>
          <span className="font-mono text-2xl font-bold text-foreground">2 / 10</span>
          <span className="text-xs text-muted-foreground font-mono ml-1">mild post-walk</span>
          <div className="h-1.5 w-full bg-muted/40 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-clinical-amber rounded-full" style={{ width: '20%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Log Session Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Record Mobility Session
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Log completed walking, range of motion, or pulmonary exercise
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handleAddSession} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="th-type" className="text-xs font-mono text-muted-foreground uppercase">
                    Therapy Modality
                  </Label>
                  <select
                    id="th-type"
                    value={newSession.type}
                    onChange={(e) => setNewSession({ ...newSession, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Early ERAS Ambulation Walk">Early ERAS Ambulation Walk</option>
                    <option value="Incentive Spirometry & Deep Breathing">Incentive Spirometry & Deep Breathing</option>
                    <option value="Lower Extremity Range of Motion">Lower Extremity Range of Motion</option>
                    <option value="Core & Pelvic Stabilization">Core & Pelvic Stabilization</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="th-dur" className="text-xs font-mono text-muted-foreground uppercase">
                      Minutes
                    </Label>
                    <Input
                      id="th-dur"
                      type="number"
                      value={newSession.duration}
                      onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
                      className="h-10 text-xs font-mono border-border bg-muted/30"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pain-b" className="text-xs font-mono text-muted-foreground uppercase">
                      Pain (Pre)
                    </Label>
                    <Input
                      id="pain-b"
                      type="number"
                      min="0"
                      max="10"
                      value={newSession.painBefore}
                      onChange={(e) => setNewSession({ ...newSession, painBefore: e.target.value })}
                      className="h-10 text-xs font-mono border-border bg-muted/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pain-a" className="text-xs font-mono text-muted-foreground uppercase">
                      Pain (Post)
                    </Label>
                    <Input
                      id="pain-a"
                      type="number"
                      min="0"
                      max="10"
                      value={newSession.painAfter}
                      onChange={(e) => setNewSession({ ...newSession, painAfter: e.target.value })}
                      className="h-10 text-xs font-mono border-border bg-muted/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="th-notes" className="text-xs font-mono text-muted-foreground uppercase">
                    Session Notes
                  </Label>
                  <Input
                    id="th-notes"
                    placeholder="Distance covered, assistance needed, or dizziness..."
                    value={newSession.notes}
                    onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                    className="h-10 text-xs border-border bg-muted/30"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-xs font-mono font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Commit Session to Rehab Protocol
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* History Feed */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Logged Rehabilitation Sessions ({sessions.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Functional recovery exercise log
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3">
              {sessions.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-border/60 bg-muted/15 flex items-start justify-between gap-3 hover:border-border transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">{item.type}</span>
                      <span className="font-mono text-[10px] text-primary px-1.5 py-0.5 rounded bg-primary/10">
                        {item.duration} min
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.notes}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-secondary" /> {item.date}
                      </span>
                      <span>•</span>
                      <span>Pain: {item.painBefore}/10 → {item.painAfter}/10</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSession(item.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
