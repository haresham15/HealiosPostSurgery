'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  SplitSquareVertical,
  Activity,
  Layers,
  Sparkles,
  Flame,
  Info,
} from 'lucide-react';

export interface DualLensTissueMetrics {
  epithelial_rate?: string;
  erythema_radius?: string;
  granulation_score?: number;
  granulation_percent?: number;
  slough_percent?: number;
  necrosis_percent?: number;
  erythema_index?: number;
  staple_integrity?: string;
  exudate_level?: string;
}

interface DualLensProps {
  currentUrl: string;
  baselineUrl?: string;
  heatmapUrl?: string;
  predictedClass?: string;
  tissueMetrics?: DualLensTissueMetrics;
}

type ViewMode = 'baseline-vs-today' | 'today-vs-heatmap' | 'solo-heatmap';

export const DualLensWoundViewer = ({
  currentUrl,
  baselineUrl = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  heatmapUrl,
  predictedClass = 'Surgical Wounds',
  tissueMetrics = {
    granulation_percent: 88,
    slough_percent: 10,
    necrosis_percent: 2,
    erythema_radius: '2.8 mm (stable)',
    granulation_score: 88,
    staple_integrity: '14/14 intact',
    exudate_level: 'Serous Minimal',
  },
}: DualLensProps) => {
  const [mode, setMode] = useState<ViewMode>(heatmapUrl ? 'today-vs-heatmap' : 'baseline-vs-today');
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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback if capture lost
    }
  };

  // Tissue morphology percentages
  const granPercent = tissueMetrics.granulation_percent ?? tissueMetrics.granulation_score ?? 85;
  const sloughPercent = tissueMetrics.slough_percent ?? 12;
  const necPercent = tissueMetrics.necrosis_percent ?? 3;

  // Decide left and right images based on selected mode
  const leftImageSrc = mode === 'baseline-vs-today' ? baselineUrl : currentUrl;
  const leftImageLabel = mode === 'baseline-vs-today' ? 'DAY 1 (BASELINE)' : "TODAY'S SCAN (NATURAL)";

  const rightImageSrc = mode === 'baseline-vs-today' ? currentUrl : (heatmapUrl || currentUrl);
  const rightImageLabel = mode === 'baseline-vs-today'
    ? "TODAY'S SCAN"
    : 'GRAD-CAM SALIENCY HEATMAP';

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-lg transition-all">
        {/* Top Control Bar & Mode Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/70 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-foreground">Explainable AI & Comparative Lens</span>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-border/80 bg-background/90 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setMode('baseline-vs-today')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                mode === 'baseline-vs-today'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Baseline vs Today
            </button>
            {heatmapUrl && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('today-vs-heatmap')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                    mode === 'today-vs-heatmap'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  AI Attention Split
                </button>
                <button
                  type="button"
                  onClick={() => setMode('solo-heatmap')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                    mode === 'solo-heatmap'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Flame className="h-3 w-3" />
                  Heatmap Overlay
                </button>
              </>
            )}
          </div>
        </div>

        {/* Viewport Area */}
        {mode === 'solo-heatmap' && heatmapUrl ? (
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-black select-none">
            <Image
              src={heatmapUrl}
              alt="Grad-CAM Activation Map"
              fill
              unoptimized
              className="object-contain"
            />
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/80 text-amber-400 backdrop-blur-md border border-amber-500/30 flex items-center gap-1.5 shadow-md">
                <Flame className="h-3.5 w-3.5" />
                CONVNET ATTENTION FOCUS (GRAD-CAM)
              </span>
            </div>

            {/* Heatmap Legend Bar */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-72 p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-[11px] text-white">
              <div className="flex justify-between items-center mb-1 text-[10px] text-zinc-300 font-medium">
                <span>Baseline Margin</span>
                <span>Peak AI Activation</span>
              </div>
              <div className="h-2 rounded-full w-full bg-gradient-to-r from-blue-600 via-emerald-400 via-amber-400 to-red-600 shadow-inner" />
              <div className="mt-1 text-[9px] text-zinc-400 flex items-center justify-between">
                <span>Inert Tissue</span>
                <span>Discriminative Region</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative aspect-[16/10] sm:aspect-[16/9] w-full select-none cursor-ew-resize overflow-hidden bg-black touch-none"
          >
            {/* Left Layer */}
            <div className="absolute inset-0">
              <Image
                src={leftImageSrc}
                alt={leftImageLabel}
                fill
                unoptimized
                className="object-cover opacity-95"
              />
              <div className="absolute top-3 left-3 pointer-events-none">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/80 text-white/95 backdrop-blur-sm border border-white/10 shadow-sm">
                  {leftImageLabel}
                </span>
              </div>
            </div>

            {/* Right Layer (Clipped by Slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
              }}
            >
              <Image
                src={rightImageSrc}
                alt={rightImageLabel}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-md flex items-center gap-1.5">
                  {mode === 'today-vs-heatmap' && <Sparkles className="h-3 w-3" />}
                  {rightImageLabel}
                </span>
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(255,255,255,0.85)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border-2 border-white flex items-center justify-center shadow-xl text-primary transition-transform active:scale-110">
                <SplitSquareVertical className="h-4 w-4" />
              </div>
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white/80 backdrop-blur-xs">
                Slide across incision
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Tissue Morphology Telemetry Bar */}
        <div className="p-3.5 bg-card/60 border-t border-border/70 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Tissue Bed Morphology & Healing Kinetics
            </span>
            <span className="text-[11px] text-muted-foreground">
              Classified: <strong className="text-foreground">{predictedClass}</strong>
            </span>
          </div>

          {/* Color-Coded Morphology Bar */}
          <div className="space-y-1">
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${granPercent}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Granulation (Healthy): ${granPercent}%`}
              />
              <div
                style={{ width: `${sloughPercent}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Slough (Fibrinous): ${sloughPercent}%`}
              />
              <div
                style={{ width: `${necPercent}%` }}
                className="bg-zinc-700 h-full transition-all duration-500"
                title={`Necrosis (Non-viable): ${necPercent}%`}
              />
            </div>

            {/* Legend & Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-muted-foreground">Granulation:</span>
                <span className="font-bold text-foreground">{granPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-muted-foreground">Slough:</span>
                <span className="font-bold text-foreground">{sloughPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-700 flex-shrink-0" />
                <span className="text-muted-foreground">Necrosis:</span>
                <span className="font-bold text-foreground">{necPercent}%</span>
              </div>
            </div>
          </div>

          {/* Reassuring Clinical Parameter Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border/60 pt-2 border-t border-border/50 text-xs">
            <div className="pr-3 text-left">
              <span className="text-[10px] text-muted-foreground uppercase block font-medium">
                Erythema Boundary
              </span>
              <span className="font-semibold text-foreground">
                {tissueMetrics.erythema_radius || '2.8 mm (stable)'}
              </span>
            </div>
            <div className="px-3 text-left">
              <span className="text-[10px] text-muted-foreground uppercase block font-medium">
                Exudate Volume
              </span>
              <span className="font-semibold text-primary">
                {tissueMetrics.exudate_level || 'Serous Minimal'}
              </span>
            </div>
            <div className="pl-3 text-left hidden sm:block">
              <span className="text-[10px] text-muted-foreground uppercase block font-medium">
                Closure Integrity
              </span>
              <span className="font-semibold text-foreground">
                {tissueMetrics.staple_integrity || 'Approximated & Intact'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
