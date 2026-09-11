'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, ShieldCheck, Stethoscope, Phone, Calendar, Hospital, AlertCircle, Edit2, Save, X, Loader2 } from 'lucide-react';
import { RecoveryStore, PatientPassport } from '@/lib/recovery-store';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const [passport, setPassport] = useState<PatientPassport | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PatientPassport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    // 1. Instant local load
    const localData = RecoveryStore.getPassport();
    setPassport(localData);
    setFormData(localData);

    // 2. Fetch ground truth from backend SQLite EHR
    try {
      const remoteUser = await api.getUser('pat-default');
      if (remoteUser) {
        const merged: PatientPassport = {
          ...localData,
          name: remoteUser.name || localData.name,
          age: remoteUser.age || localData.age,
          gender: remoteUser.gender || localData.gender,
          mrn: remoteUser.mrn || localData.mrn,
          procedure: remoteUser.procedure_name || localData.procedure,
          attendingSurgeon: remoteUser.surgeon_name || localData.attendingSurgeon,
          surgeryDate: remoteUser.surgery_date || localData.surgeryDate,
          surgicalFacility: remoteUser.facility || localData.surgicalFacility,
          emergencyContact: {
            ...localData.emergencyContact,
            phone: remoteUser.clinic_phone || localData.emergencyContact.phone,
          },
        };
        setPassport(merged);
        setFormData(merged);
        RecoveryStore.setPassport(merged);
      }
    } catch (err) {
      console.warn('Could not sync user profile from backend; using local store cache.', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('healios-store-update', loadData);
    return () => window.removeEventListener('healios-store-update', loadData);
  }, []);

  if (!passport || !formData) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Persist to backend database
      await api.updateUser('pat-default', {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        procedure_name: formData.procedure,
        surgeon_name: formData.attendingSurgeon,
        surgery_date: formData.surgeryDate,
        facility: formData.surgicalFacility,
        clinic_phone: formData.emergencyContact.phone,
      });

      // Persist locally
      RecoveryStore.setPassport(formData);
      setPassport(formData);
      setIsEditing(false);

      toast({
        title: 'Passport Updated',
        description: 'Your clinical profile and EHR records were synchronized with the hospital registry.',
      });
    } catch (err) {
      console.error('Failed to update remote user:', err);
      // Fallback local save
      RecoveryStore.setPassport(formData);
      setPassport(formData);
      setIsEditing(false);
      toast({
        title: 'Local Save Only',
        description: 'Saved to local browser storage; backend server was unreachable.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(passport);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/30 bg-primary/10">
              Electronic Health Record
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Verified Surgical Registry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Patient Surgical Passport
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Official post-operative clinical profile, attending physician credentials, emergency proxies, and surgical facility routing.
          </p>
        </div>

        {!isEditing ? (
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-9 gap-1.5 text-xs font-mono font-semibold border-border bg-card hover:bg-muted text-foreground self-start sm:self-auto border shadow-xs"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit Passport
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-9 text-xs font-mono border-border gap-1"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 text-xs font-mono font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Surgical Dossier */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Operative Summary & Procedure Dossier
              </CardTitle>
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                MRN {passport.mrn}
              </span>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-muted/15 space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Procedure Performed</span>
                    <span className="text-sm font-bold text-foreground block">{passport.procedure}</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-muted/15 space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Attending Surgeon</span>
                    <span className="text-sm font-bold text-foreground block">{passport.attendingSurgeon}</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-muted/15 space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Surgery Date</span>
                    <span className="text-sm font-mono font-bold text-foreground block">{passport.surgeryDate}</span>
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-muted/15 space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Surgical Timeline</span>
                    <span className="text-sm font-mono font-bold text-primary block">
                      POD {passport.postOpDay} (Target POD {passport.dischargeTargetPOD})
                    </span>
                  </div>

                  <div className="sm:col-span-2 p-3 rounded-lg border border-border bg-muted/15 space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase block">Facility & Surgical Unit</span>
                    <span className="text-sm font-semibold text-foreground block">{passport.surgicalFacility}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono text-muted-foreground uppercase">Procedure Description</Label>
                    <Input
                      value={formData.procedure}
                      onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                      className="text-xs border-border bg-muted/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-muted-foreground uppercase">Attending Surgeon</Label>
                      <Input
                        value={formData.attendingSurgeon}
                        onChange={(e) => setFormData({ ...formData, attendingSurgeon: e.target.value })}
                        className="text-xs border-border bg-muted/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-mono text-muted-foreground uppercase">Surgery Date</Label>
                      <Input
                        type="date"
                        value={formData.surgeryDate}
                        onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })}
                        className="text-xs font-mono border-border bg-muted/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono text-muted-foreground uppercase">Surgical Facility / Unit</Label>
                    <Input
                      value={formData.surgicalFacility}
                      onChange={(e) => setFormData({ ...formData, surgicalFacility: e.target.value })}
                      className="text-xs border-border bg-muted/20"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Personal & Emergency Contacts */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-border/80 bg-card/75 backdrop-blur-md rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/70">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Patient Identity & Emergency Proxy
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border border-border bg-muted/15 space-y-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">Legal Patient Name</span>
                <span className="text-sm font-bold text-foreground block">{passport.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {passport.age} Years Old • {passport.gender}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                <span className="text-[10px] font-mono text-amber-500 uppercase font-bold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Emergency Contact / Next of Kin
                </span>
                <span className="text-sm font-bold text-foreground block">{passport.emergencyContact.name}</span>
                <span className="text-xs font-mono text-primary font-semibold block">
                  {passport.emergencyContact.phone}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Relationship: {passport.emergencyContact.relationship}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/15 space-y-1 text-[11px]">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground block">
                  Known Allergies & Contraindications
                </span>
                <p className="text-muted-foreground">
                  NKDA (No Known Drug Allergies). Penicillin tolerance verified during pre-op triage.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
