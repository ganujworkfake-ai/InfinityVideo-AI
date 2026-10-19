import React from 'react';
import { VideoProject } from '../types/index.ts';
import { VideoPlayer } from './VideoPlayer.tsx';
import { 
  CheckCircle, 
  RotateCw, 
  XCircle, 
  Camera, 
  Layers, 
  Play
} from 'lucide-react';

interface GenerationDashboardProps {
  project: VideoProject;
  onRetry: () => void;
  onCancel: () => void;
  onNewVideo: () => void;
  isRetrying: boolean;
}

export const GenerationDashboard: React.FC<GenerationDashboardProps> = ({
  project,
  onRetry,
  onCancel,
  onNewVideo,
  isRetrying,
}) => {
  const isGenerating = project.status === 'generating';
  const isStitching = project.status === 'stitching';
  const isCompleted = project.status === 'completed';
  const isFailed = project.status === 'failed';
  const isCancelled = project.status === 'cancelled';

  // Count scene stats
  const completedCount = project.clips.filter((c) => c.status === 'completed').length;
  const totalClips = project.clips.length;

  return (
    <div className="space-y-6">
      {/* Top Status Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Job ID: {project.id}
              </span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-400">
                Target Duration: <strong className="font-mono text-cyan-400 tabular-nums">{project.requestedDuration}s</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{project.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">
              &ldquo;{project.prompt}&rdquo;
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {(isGenerating || isStitching) && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                Cancel Job
              </button>
            )}

            {isFailed && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm disabled:opacity-50"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry Failed Scenes
              </button>
            )}

            <button
              type="button"
              onClick={onNewVideo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Play className="h-3 w-3 text-cyan-400" />
              New Video
            </button>
          </div>
        </div>

        {/* Stage & Progress Indicator */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-2">
              {isGenerating && (
                <>
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  Generating Clips ({completedCount} of {totalClips} complete)
                </>
              )}
              {isStitching && (
                <>
                  <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                  Stitching & Normalizing Video Clips with FFmpeg...
                </>
              )}
              {isCompleted && (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Video Generation & Duration Audit Complete
                </>
              )}
              {isFailed && (
                <>
                  <XCircle className="h-4 w-4 text-rose-400" />
                  Generation Encountered An Error
                </>
              )}
              {isCancelled && (
                <>
                  <XCircle className="h-4 w-4 text-slate-500" />
                  Generation Cancelled
                </>
              )}
            </span>

            <span className="font-mono tabular-nums text-slate-400 font-semibold">
              {project.progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
            <div
              style={{ width: `${project.progress}%` }}
              className={`h-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
              }`}
            />
          </div>

          {/* Stage Step Breadcrumb */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className={project.status !== 'draft' ? 'text-cyan-400 font-medium' : ''}>
              1. Storyboard Plan
            </span>
            <span>→</span>
            <span className={isGenerating || isStitching || isCompleted ? 'text-cyan-400 font-medium' : ''}>
              2. Multi-Clip Generation
            </span>
            <span>→</span>
            <span className={isStitching || isCompleted ? 'text-cyan-400 font-medium' : ''}>
              3. FFmpeg Assembly
            </span>
            <span>→</span>
            <span className={isCompleted ? 'text-emerald-400 font-medium' : ''}>
              4. Duration Validation
            </span>
          </div>

          {/* Error Message if Failed */}
          {project.error && (
            <div className="mt-3 rounded-md border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-200">
              <strong className="text-rose-100">Failure details: </strong>
              {project.error}
            </div>
          )}
        </div>
      </div>

      {/* Completed Video Player Preview */}
      {isCompleted && (
        <VideoPlayer project={project} />
      )}

      {/* Multi-Clip Breakdown & Live Scene Status */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Scene Clips Status ({completedCount} / {totalClips} Generated)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sum: {project.plannedDuration.toFixed(1)}s
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {project.clips.map((clip, idx) => {
            const clipDone = clip.status === 'completed';
            const clipGen = clip.status === 'generating';
            const clipFail = clip.status === 'failed';

            return (
              <div
                key={clip.id}
                className={`flex flex-col justify-between rounded-lg border p-3.5 text-xs transition-all ${
                  clipDone
                    ? 'border-emerald-900/50 bg-slate-900/80'
                    : clipFail
                    ? 'border-rose-900/60 bg-rose-950/20'
                    : clipGen
                    ? 'border-cyan-500/50 bg-cyan-950/10'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white">
                      Scene {idx + 1}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono tabular-nums text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        {clip.plannedDuration.toFixed(1)}s
                      </span>
                      {clipDone && (
                        <span className="text-emerald-400 font-semibold text-[10px]">Ready</span>
                      )}
                      {clipGen && (
                        <span className="text-cyan-400 font-semibold text-[10px] flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                          {clip.progress}%
                        </span>
                      )}
                      {clipFail && (
                        <span className="text-rose-400 font-semibold text-[10px]">Failed</span>
                      )}
                      {clip.status === 'pending' && (
                        <span className="text-slate-500 text-[10px]">Queued</span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2 mb-2">
                    {clip.sceneDescription || clip.title}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-800/80 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Camera className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{clip.cameraMovement}</span>
                  </div>

                  {/* Individual clip progress */}
                  {clipGen && (
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${clip.progress}%` }}
                        className="h-full bg-cyan-400 transition-all duration-300"
                      />
                    </div>
                  )}

                  {/* Clip video player preview if ready */}
                  {clipDone && clip.videoUrl && (
                    <div className="pt-1">
                      <video
                        src={clip.videoUrl}
                        controls
                        className="h-24 w-full rounded bg-black object-cover"
                      />
                    </div>
                  )}

                  {/* Clip error text */}
                  {clipFail && clip.error && (
                    <div className="text-[10px] text-rose-300 truncate">
                      {clip.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
