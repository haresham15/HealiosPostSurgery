'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pill, Plus, Check, Clock, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { RecoveryStore, MedicationRecord } from '@/lib/recovery-store';

export default function MedicationPage() {
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    scheduleSlot: 'Morning' as MedicationRecord['scheduleSlot'],
    instructions: '',
  });

  const loadData = () => {
    setMedications(RecoveryStore.getMedications());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healios-store-update', loadData);
    return () => window.removeEventListener('healios-store-update', loadData);
  }, []);

  const handleToggleDose = (id: string) => {
    RecoveryStore.toggleMedication(id);
  };

  const handleDelete = (id: string) => {
    RecoveryStore.deleteMedication(id);
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage) return;

    RecoveryStore.addMedication({
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      category: 'Analgesic',
      scheduleSlot: newMed.scheduleSlot,
      totalDays: 7,
      instructions: newMed.instructions || 'Take with a glass of water.',
    });

    setNewMed({
      name: '',
      dosage: '',
      frequency: 'Once daily',
      scheduleSlot: 'Morning',
      instructions: '',
    });
    setShowAddForm(false);
  };

  const completedToday = medications.filter((m) => m.completedToday).length;
  const antibiotic = medications.find((m) => m.category === 'Antibiotic');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pill className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase">Prescription Tracker</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Today's Medications
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keep track of your prescribed medicines and check them off as you take them.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-3 py-1 text-primary border-primary/30 bg-primary/10 font-bold">
            {completedToday} of {medications.length} Taken Today
          </Badge>

          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Med</span>
          </Button>
        </div>
      </div>

      {/* Simplified Antibiotic Highlight */}
      {antibiotic && (
        <Card className="border border-primary/30 bg-primary/5 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Antibiotic Course</span>
                <span className="text-sm font-bold text-foreground">{antibiotic.name} ({antibiotic.dosage})</span>
              </div>
            </div>

            <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10 self-start sm:self-auto">
              Day {antibiotic.currentDay} of {antibiotic.totalDays}
            </Badge>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.round((antibiotic.currentDay / antibiotic.totalDays) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Please finish the full 7-day bottle as prescribed by your surgeon.
            </p>
          </div>
        </Card>
      )}

      {/* Add Medication Drawer (Simple & Collapsible) */}
      {showAddForm && (
        <Card className="border border-border/80 bg-card p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground">Add New Medication</h3>
          <form onSubmit={handleAddMedication} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Medicine Name</Label>
              <Input
                placeholder="e.g. Ibuprofen"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                className="h-9 text-xs border-border bg-muted/20"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground">Dosage</Label>
              <Input
                placeholder="e.g. 400 mg"
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                className="h-9 text-xs border-border bg-muted/20"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground">When to take</Label>
              <select
                value={newMed.scheduleSlot}
                onChange={(e) =>
                  setNewMed({ ...newMed, scheduleSlot: e.target.value as MedicationRecord['scheduleSlot'] })
                }
                className="w-full h-9 px-3 rounded-lg border border-border bg-muted/20 text-xs text-foreground"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Bedtime">Bedtime</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs bg-primary text-primary-foreground font-semibold">
                Save Medicine
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Clean Checklist of Prescriptions */}
      <div className="space-y-3">
        {medications.map((med) => (
          <div
            key={med.id}
            onClick={() => handleToggleDose(med.id)}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
              med.completedToday
                ? 'border-primary/40 bg-primary/5 shadow-xs'
                : 'border-border/80 bg-card hover:border-primary/30'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center border transition-colors ${
                  med.completedToday
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border bg-muted/20 text-transparent'
                }`}
              >
                <Check className="h-4 w-4 stroke-[3]" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${med.completedToday ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {med.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">({med.dosage})</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {med.frequency} • {med.instructions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Badge variant="outline" className="text-[11px] font-medium hidden sm:inline-block border-border">
                {med.scheduleSlot}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(med.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
