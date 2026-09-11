'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShieldCheck,
  ArrowRight,
  Camera,
  CheckCircle2,
  Heart,
  Pill,
  Sparkles,
  Stethoscope,
  Scan,
} from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground telemetry-grid flex flex-col">
      {/* Clean Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground font-sans">
              Healios
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/patient/dashboard">
              <Button className="h-10 px-5 gap-1.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <span>Open Patient Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Welcome Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-primary border-primary/30 bg-primary/10">
            Post-Operative Recovery Companion
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Post-Surgery Recovery, <br />
            <span className="text-primary">Made Simple & Reassuring.</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Check your surgical wound healing from home, stay on top of daily medications, and share peace of mind with your care team.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/patient/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-12 px-7 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm">
                <span>Go to Your Recovery Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/patient/wound_check" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-12 px-6 text-sm font-semibold rounded-xl border-border">
                <Camera className="h-4 w-4 mr-2 text-primary" />
                Take Wound Photo
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Simple Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Card className="border border-border/80 bg-card/85 p-6 rounded-2xl shadow-xs space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">1. Snap a Photo</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Take a clear picture of your incision using your phone or computer camera in normal room lighting.
            </p>
          </Card>

          <Card className="border border-border/80 bg-card/85 p-6 rounded-2xl shadow-xs space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">2. Instant Healing Check</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our AI verifies that your incision edges are closed and checks for any unusual redness or infection flags.
            </p>
          </Card>

          <Card className="border border-border/80 bg-card/85 p-6 rounded-2xl shadow-xs space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-foreground">3. Care Team Connected</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your daily recovery notes, medications, and photos are organized and ready for your surgeon's review.
            </p>
          </Card>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-border/70 bg-card/40 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Healios Post-Op Recovery</span>
          </div>
          <span>Clinical Demonstration &amp; Post-Surgical Recovery Research Prototype</span>
        </div>
      </footer>
    </div>
  );
}
