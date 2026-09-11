'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Activity,
  Plus,
  Heart,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Send,
  Loader2,
  Clock,
  FileText,
} from 'lucide-react';
import { RecoveryStore, VitalRecord } from '@/lib/recovery-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, SymptomLog } from '@/lib/api';

const DEMO_USER_ID = 'demo_user_001';

export default function VitalsAndSymptomsPage() {
  const [activeSubTab, setActiveSubTab] = useState<'vitals' | 'symptoms'>('vitals');
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [newVitalVal, setNewVitalVal] = useState('');
  const [vitalType, setVitalType] = useState<VitalRecord['type']>('temperature');

  // Symptom log state
  const queryClient = useQueryClient();
  const [symptomText, setSymptomText] = useState('');
  const [painScale, setPainScale] = useState(2);

  const loadData = () => {
    setVitals(RecoveryStore.getVitals());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healios-store-update', loadData);
    return () => window.removeEventListener('healios-store-update', loadData);
  }, []);

  // Fetch symptom logs
  const { data: logs = [] } = useQuery({
    queryKey: ['symptom-logs', DEMO_USER_ID],
    queryFn: async () => {
      try {
        return await api.getLogs(DEMO_USER_ID);
      } catch {
        return [];
      }
    },
  });

  const addLogMutation = useMutation({
    mutationFn: async (data: { text: string; urgency: number }) => {
      try {
        return await api.createLog(DEMO_USER_ID, data.text, data.urgency);
      } catch {
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptom-logs'] });
      setSymptomText('');
      setPainScale(2);
    },
  });

  const handleRecordVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVitalVal) return;

    const num = parseFloat(newVitalVal);
    let status: 'nominal' | 'warning' | 'critical' = 'nominal';
    if (vitalType === 'temperature' && num > 100.4) status = 'warning';
    if (vitalType === 'heart-rate' && num > 105) status = 'warning';

    const labels: Record<VitalRecord['type'], string> = {
      'temperature': 'Core Body Temp',
      'heart-rate': 'Resting Heart Rate',
      'incision-delta': 'Incision Temp Delta',
      'oxygen': 'Oxygen SpO2',
      'blood-pressure': 'Blood Pressure',
    };

    const units: Record<VitalRecord['type'], string> = {
      'temperature': '°F',
      'heart-rate': 'bpm',
      'incision-delta': '°F',
      'oxygen': '%',
      'blood-pressure': 'mmHg',
    };

    RecoveryStore.addVital({
      type: vitalType,
      label: labels[vitalType],
      value: newVitalVal,
      unit: units[vitalType],
      status,
      normative: 'Normal Range',
    });

    setNewVitalVal('');
  };

  const handleSendSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomText.trim()) return;

    addLogMutation.mutate({
      text: `Pain Level: ${painScale}/10. ${symptomText.trim()}`,
      urgency: painScale >= 8 ? 10.0 : painScale >= 5 ? 5.0 : 1.0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase">Daily Check-In</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Vitals & How You're Feeling
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record your daily temperature, heart rate, or any discomfort you are experiencing.
          </p>
        </div>

        {/* Clean Sub-tab Toggle */}
        <div className="flex rounded-xl border border-border p-1 bg-muted/30 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('vitals')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'vitals'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Vital Signs
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('symptoms')}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'symptoms'
                ? 'bg-card text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Symptom Diary
          </button>
        </div>
      </div>

      {activeSubTab === 'vitals' ? (
        <div className="space-y-6">
          {/* Quick Vitals Readouts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vitals.map((vital) => (
              <Card key={vital.id} className="border border-border/80 bg-card/85 p-5 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-foreground">{vital.label}</span>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10">
                    {vital.status === 'nominal' ? 'Normal' : 'Watch'}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl font-black tracking-tight text-foreground">{vital.value}</span>
                  <span className="text-xs text-muted-foreground font-bold">{vital.unit}</span>
                </div>

                <span className="text-[11px] text-muted-foreground block mt-1">
                  Last checked: {vital.timestamp}
                </span>
              </Card>
            ))}
          </div>

          {/* Record Vital Form */}
          <Card className="border border-border/80 bg-card/85 p-5 rounded-2xl shadow-xs">
            <h3 className="text-sm font-bold text-foreground mb-3">Record a New Reading</h3>
            <form onSubmit={handleRecordVital} className="flex flex-col sm:flex-row gap-3">
              <select
                value={vitalType}
                onChange={(e) => setVitalType(e.target.value as VitalRecord['type'])}
                className="h-10 px-3 rounded-xl border border-border bg-muted/20 text-xs font-semibold text-foreground"
              >
                <option value="temperature">Body Temperature (°F)</option>
                <option value="heart-rate">Heart Rate (bpm)</option>
                <option value="oxygen">Oxygen Level (%)</option>
                <option value="blood-pressure">Blood Pressure (mmHg)</option>
              </select>

              <Input
                type="text"
                placeholder="Enter value (e.g. 98.6)"
                value={newVitalVal}
                onChange={(e) => setNewVitalVal(e.target.value)}
                className="h-10 text-xs border-border bg-muted/20 sm:w-48"
                required
              />

              <Button type="submit" className="h-10 text-xs font-bold rounded-xl bg-primary text-primary-foreground px-5">
                Save Reading
              </Button>
            </form>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border border-border/80 bg-card/85 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground">How are you feeling right now?</h3>

              <form onSubmit={handleSendSymptom} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <Label className="text-muted-foreground">Pain Level (0 = None, 10 = Severe)</Label>
                    <span className="font-bold text-primary text-sm">{painScale} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painScale}
                    onChange={(e) => setPainScale(parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Notes for your doctor</Label>
                  <Textarea
                    placeholder="e.g. Mild soreness getting out of bed, appetite is normal..."
                    value={symptomText}
                    onChange={(e) => setSymptomText(e.target.value)}
                    rows={3}
                    className="text-xs border-border bg-muted/20 resize-none leading-relaxed"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={addLogMutation.isPending}
                  className="w-full h-10 text-xs font-bold rounded-xl bg-primary text-primary-foreground gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  {addLogMutation.isPending ? 'Saving...' : 'Send Note to Care Team'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Recent Notes & Diary Entries
            </h3>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <Card className="p-8 text-center text-xs text-muted-foreground border-border/80 rounded-2xl">
                  No notes recorded yet today.
                </Card>
              ) : (
                logs.map((log: any) => (
                  <Card key={log.id} className="p-4 rounded-2xl border-border/80 bg-card/75 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" />
                        {new Date(log.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-primary font-medium">Logged</span>
                    </div>
                    <p className="text-foreground leading-relaxed font-sans">{log.free_text}</p>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
