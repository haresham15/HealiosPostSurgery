'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { SplitSquareVertical, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DualLensProps {
  currentUrl: string;
  baselineUrl?: string;
  predictedClass?: string;
  tissueMetrics?: {
    epithelial_rate: string;
    erythema_radius: string;
    granulation_score: number;
    staple_integrity: string;
    exudate_level: string;
  };
}

export const DualLensWoundViewer = ({
  currentUrl,
  baselineUrl = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  predictedClass = 'Surgical Wounds',
  tissueMetrics = {
    epithelial_rate: '+1.6 mm/day',
    erythema_radius: '2.8 mm (stable)',
    granulation_score: 92,
    staple_integrity: '14/14 intact',
    exudate_level: 'Serous Minimal',
  },
}: DualLensProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(clamped);
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/80 bg-black overflow-hidden shadow-md">
        {/* Simple Viewer Top Label */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border/70 text-xs">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Comparison Lens
          </span>
          <span className="text-muted-foreground text-[11px]">
            Drag white bar left or right to compare
          </span>
        </div>

        {/* Interactive Split Viewport */}
        <div
          ref={containerRef}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove}
          className="relative aspect-[16/10] sm:aspect-[16/9] w-full select-none cursor-ew-resize overflow-hidden bg-black"
        >
          {/* Baseline Image (Day 1) */}
          <div className="absolute inset-0">
            <Image
              src={baselineUrl}
              alt="Baseline Post-Op Day 1"
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/75 text-white/90 backdrop-blur-sm border border-white/10">
                DAY 1 (BASELINE)
              </span>
            </div>
          </div>

          {/* Current Scan Image */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
            }}
          >
            <Image
              src={currentUrl}
              alt="Current Wound Photo"
              fill
              className="object-cover"
            />
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-sm">
                TODAY'S SCAN
              </span>
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            onMouseDown={onMouseDown}
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border-2 border-white flex items-center justify-center shadow-lg text-primary">
              <SplitSquareVertical className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Clean, Reassuring Bottom Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border/60 bg-card px-3 py-2.5 text-xs">
          <div className="px-3 text-center sm:text-left">
            <span className="text-[10px] text-muted-foreground uppercase block font-medium">Incision Margin</span>
            <span className="font-semibold text-foreground">Closed & Intact</span>
          </div>
          <div className="px-3 text-center sm:text-left">
            <span className="text-[10px] text-muted-foreground uppercase block font-medium">Swelling / Redness</span>
            <span className="font-semibold text-primary">Normal & Minimal</span>
          </div>
          <div className="px-3 text-center sm:text-left hidden sm:block">
            <span className="text-[10px] text-muted-foreground uppercase block font-medium">Healing Rate</span>
            <span className="font-semibold text-foreground">On Schedule</span>
          </div>
        </div>
      </div>
    </div>
  );
};
