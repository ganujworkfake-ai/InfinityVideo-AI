import React, { useState } from 'react';
import { AspectRatio, VisualStyle, ProviderCapability } from '../types/index.ts';
import { Sliders, Shield, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface VideoSettingsProps {
  duration: number;
  setDuration: (val: number) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (val: AspectRatio) => void;
  style: VisualStyle;
  setStyle: (val: VisualStyle) => void;
  resolution: string;
  setResolution: (val: string) => void;
  fps: number;
  setFps: (val: number) => void;
  seed: number | undefined;
  setSeed: (val: number | undefined) => void;
  negativePrompt: string;
  setNegativePrompt: (val: string) => void;
  activeProvider: ProviderCapability;
  onOpenProviderModal: () => void;
}

export const VideoSettings: React.FC<VideoSettingsProps> = ({
  duration,
  setDuration,
  aspectRatio,
  setAspectRatio,
  style,
  setStyle,
  resolution,
  setResolution,
  fps,
  setFps,
  seed,
  setSeed,
  negativePrompt,
  setNegativePrompt,
  activeProvider,
  onOpenProviderModal,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const aspectRatios: { id: AspectRatio; label: string; iconClass: string; desc: string }[] = [
    { id: '16:9', label: '16:9 Landscape', iconClass: 'w-6 h-3.5', desc: 'YouTube, Web, TV' },
    { id: '9:16', label: '9:16 Vertical', iconClass: 'w-3.5 h-6', desc: 'TikTok, Reels, Shorts' },
    { id: '1:1', label: '1:1 Square', iconClass: 'w-4 h-4', desc: 'Instagram feed, Ads' },
  ];

  const styles: { id: VisualStyle; label: string; desc: string }[] = [
    { id: 'cinematic', label: 'Cinematic', desc: '35mm anamorphic film' },
    { id: 'realistic', label: 'Realistic', desc: 'Photorealistic natural lighting' },
    { id: 'animation', label: 'Animation', desc: 'Anime & stylized 3D' },
    { id: 'cartoon', label: 'Cartoon', desc: 'Vibrant expressive 2D' },
    { id: 'fantasy', label: 'Fantasy', desc: 'Ethereal & mythical aura' },
    { id: 'documentary', label: 'Documentary', desc: 'IMAX raw camera grade' },
  ];

  // Quick preset duration pills
  const durationPresets = [10, 15, 30, 45, 60, 90];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Video Parameters & Target Duration</h3>
        </div>

        {/* Active Provider Status Indicator */}
        <button
          type="button"
          onClick={onOpenProviderModal}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <span className="text-slate-500">Provider:</span>
          <span className="font-medium text-slate-200">{activeProvider.name}</span>
          {activeProvider.isDemoMode ? (
            <span className="text-[10px] text-amber-400 font-medium">· Demo</span>
          ) : (
            <span className="text-[10px] text-emerald-400 font-medium">· Live API</span>
          )}
        </button>
      </div>

      {/* Duration Control: Numeric input + slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="duration-slider" className="text-xs font-semibold text-slate-200">
              Target Duration: <span className="font-mono text-cyan-400 font-bold text-sm tabular-nums">{duration}s</span>
              <span className="text-slate-400 text-xs ml-2 font-normal">
                ({(duration / 60).toFixed(1)} mins)
              </span>
            </label>
            <p className="text-[11px] text-slate-400">
              Provider max clip length is {activeProvider.maxSingleClipDuration}s. Videos longer than {activeProvider.maxSingleClipDuration}s will be automatically planned as multi-clip storyboards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="duration-input"
              type="number"
              min={activeProvider.minTotalDuration || 3}
              max={activeProvider.maxTotalDuration || 180}
              value={duration}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setDuration(Math.max(3, Math.min(180, val)));
              }}
              className="w-16 rounded-md border border-slate-700 bg-[#090d16] px-2 py-1 text-center font-mono text-sm font-semibold text-cyan-400 focus:border-cyan-500 focus:outline-none tabular-nums"
            />
            <span className="text-xs text-slate-400 font-medium">sec</span>
          </div>
        </div>

        {/* Range slider */}
        <input
          id="duration-slider"
          type="range"
          min={3}
          max={120}
          step={1}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        {/* Preset quick buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
          {durationPresets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDuration(p)}
              className={`rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors font-mono tabular-nums ${
                duration === p
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {p}s
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-200">Aspect Ratio</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {aspectRatios.map((item) => {
            const isSupported = activeProvider.supportedAspectRatios.includes(item.id);
            const isSelected = aspectRatio === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!isSupported}
                onClick={() => setAspectRatio(item.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  !isSupported
                    ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40'
                    : isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className={`border border-current rounded-sm ${item.iconClass} shrink-0 opacity-80`} />
                <div>
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Style Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-200">Visual Style</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {styles.map((s) => {
            const isSelected = style === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`rounded-lg border px-3 py-2 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/20 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-xs font-semibold">{s.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Accordion: Resolution, FPS, Seed, Negative Prompt */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Advanced Generation Parameters (Resolution, FPS, Negative Prompt, Seed)</span>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 rounded-lg bg-slate-900/50 p-4 border border-slate-800/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Resolution */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Output Resolution</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-[#090d16] px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  {activeProvider.supportedResolutions.map((res) => (
                    <option key={res} value={res}>
                      {res} ({res === '720p' ? '1280x720 Standard HD' : '1920x1080 Full HD'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Frame Rate */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Frame Rate (FPS)</label>
                <select
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value, 10))}
                  className="w-full rounded-md border border-slate-700 bg-[#090d16] px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                >
                  {activeProvider.supportedFps.map((f) => (
                    <option key={f} value={f}>
                      {f} fps {f === 24 ? '(Cinematic)' : '(Smooth)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seed */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Seed (Optional for reproducibility)</label>
                <input
                  type="number"
                  placeholder="Random"
                  value={seed !== undefined ? seed : ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    setSeed(val);
                  }}
                  className="w-full rounded-md border border-slate-700 bg-[#090d16] px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono placeholder:text-slate-600"
                />
              </div>

              {/* Safety & Cost limits */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">Cost Transparency</label>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Shield className="h-3.5 w-3.5 text-cyan-400" />
                  <span>
                    Est. Rate: <strong className="font-mono tabular-nums text-slate-200">${activeProvider.costPerSecondUSD.toFixed(2)}/sec</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Negative Prompt</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="blurry, distorted face, low quality, artifacts, watermark, jittery camera"
                className="w-full rounded-md border border-slate-700 bg-[#090d16] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Demo Mode Notice if active */}
      {activeProvider.isDemoMode && (
        <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
          <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Demo Engine Active: </span>
            Runs locally via FFmpeg to test custom-duration planning, multi-scene concatenation, and duration validation without consuming paid video credits. You can configure Google Veo or Replicate API keys in Engine Providers.
          </div>
        </div>
      )}
    </div>
  );
};
