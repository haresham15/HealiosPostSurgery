'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  Home,
  Scan,
  Pill,
  Activity,
  User,
  ShieldCheck,
  AlertTriangle,
  FileDown,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { DoctorEscalationModal } from '@/components/clinical/DoctorEscalationModal';
import { RecoveryConciergeChat } from '@/components/clinical/RecoveryConciergeChat';
import { RecoveryStore } from '@/lib/recovery-store';

const navItems = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: Home },
  { href: '/patient/wound_check', label: 'Wound Check', icon: Scan },
  { href: '/patient/medication', label: 'Medications', icon: Pill },
  { href: '/patient/vitals', label: 'Vitals & Symptoms', icon: Activity },
  { href: '/patient/profile', label: 'Care Team', icon: User },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);

  const passport = RecoveryStore.getPassport();
  const recoveryData = RecoveryStore.calculateRecoveryIndex();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col telemetry-grid">
      {/* Unified Single Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand + Quick Patient Context */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-foreground font-sans">
                Healios
              </span>
            </Link>

            <div className="h-5 w-px bg-border/80 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-foreground">{passport.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px] font-bold">
                Day {passport.postOpDay} Post-Op
              </span>
            </div>
          </div>

          {/* Center: Clean 5 Core Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 px-3 gap-1.5 text-xs rounded-md transition-all ${
                      isActive
                        ? 'bg-card text-primary font-bold shadow-xs border border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick Doctor Help & Mobile Menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEscalation(true)}
              className="h-8 gap-1.5 text-xs font-medium border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contact Doctor</span>
              <span className="sm:hidden">Help</span>
            </Button>

            {/* Mobile Sheet */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card border-l border-border p-5">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-bold text-sm tracking-tight text-foreground block">
                      Healios Recovery
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {passport.name} • Day {passport.postOpDay}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start h-10 gap-3 rounded-lg text-xs ${
                            isActive
                              ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : ''}`} />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronRight className="h-3 w-3 opacity-40" />
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {children}
      </main>

      <DoctorEscalationModal
        isOpen={showEscalation}
        onClose={() => setShowEscalation(false)}
        passport={passport}
        recoveryData={recoveryData}
      />

      <RecoveryConciergeChat />

      {/* Minimal Footer */}
      <footer className="border-t border-border/60 bg-card/40 py-4 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Healios Recovery Assistant • St. Jude Surgical Care</span>
          <span className="text-[11px] text-muted-foreground/70">
            For medical emergencies, call 911 or your hospital directly.
          </span>
        </div>
      </footer>
    </div>
  );
}
