import React from 'react';
import { PlanResponse } from '../services/api.ts';
import { Film, Layers, DollarSign, Camera, Play, Clock } from 'lucide-react';

interface StoryboardPlanProps {
  plan: PlanResponse | null;
  loading: boolean;
  onStartGeneration: () => void;
  isStarting: boolean;
  requestedDuration: number;
}

export const StoryboardPlan: React.FC<StoryboardPlanProps> = ({
  plan,
  loading,
  onStartGeneration,
  isStarting,
  requestedDuration,
}) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-4 w-48 bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-24 bg-slate-800/60 rounded-lg"></div>
          <div className="h-24 bg-slate-800/60 rounded-lg"></div>
          <div className="h-24 bg-slate-800/60 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Film className="h-4 w-4 text-cyan-400" />
            Storyboard & Clip Assembly Blueprint
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Planned duration: <strong className="font-mono tabular-nums text-white">{plan.plannedDuration.toFixed(1)}s</strong> across{' '}
            <strong className="text-slate-200">{plan.clips.length} scenes</strong> (Provider max clip: {plan.provider.maxSingleClipDuration}s)
          </p>
        </div>

        {/* Blueprint summary metrics */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Scenes: <strong className="font-mono text-slate-200 tabular-nums">{plan.clips.length}</strong></span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Est. Wait: <strong className="font-mono text-slate-200 tabular-nums">~{plan.estimatedQueueSeconds}s</strong></span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1 text-slate-400">
            <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
            <span>Cost: <strong className="font-mono text-slate-200 tabular-nums">${plan.estimatedCostUSD.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {/* Visual Timeline bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>0.0s</span>
          <span className="text-cyan-400 font-semibold">{plan.plannedDuration.toFixed(1)}s Total</span>
          <span>{plan.plannedDuration.toFixed(1)}s</span>
        </div>
        <div className="flex h-3 w-full rounded-md overflow-hidden bg-slate-900 border border-slate-800 p-0.5 gap-0.5">
          {plan.clips.map((clip, idx) => {
            const widthPct = (clip.plannedDuration / plan.plannedDuration) * 100;
            return (
              <div
                key={clip.id}
                style={{ width: `${widthPct}%` }}
                className="h-full rounded-sm bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-colors"
                title={`Scene ${idx + 1}: ${clip.plannedDuration.toFixed(1)}s`}
              />
            );
          })}
        </div>
      </div>

      {/* Scenes breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {plan.clips.map((clip, idx) => (
          <div
            key={clip.id}
            className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 text-xs hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold text-cyan-300">
                  {clip.title}
                </span>
                <span className="font-mono tabular-nums text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                  {clip.plannedDuration.toFixed(1)}s
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2 mb-2">
                {clip.sceneDescription}
              </p>
            </div>

            <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Camera className="h-3 w-3 text-cyan-400 shrink-0" />
              <span className="truncate">{clip.cameraMovement}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Start generation CTA button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
        <div className="text-xs text-slate-400">
          <span>Target: <strong className="text-white font-mono">{requestedDuration}s</strong></span>
          <span className="mx-2 text-slate-700">·</span>
          <span>Engine: <strong className="text-slate-200">{plan.provider.name}</strong></span>
        </div>

        <button
          type="button"
          onClick={onStartGeneration}
          disabled={isStarting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isStarting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Initializing Generation...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              Generate Video ({plan.plannedDuration.toFixed(1)}s)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
