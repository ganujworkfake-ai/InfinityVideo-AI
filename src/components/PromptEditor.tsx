import React, { useMemo } from 'react';
import { parsePromptClient } from '../services/durationParser.ts';
import { AspectRatio, VisualStyle } from '../types/index.ts';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';

interface PromptEditorProps {
  prompt: string;
  setPrompt: (val: string) => void;
  selectedDuration: number;
  setSelectedDuration: (val: number) => void;
  selectedAspectRatio: AspectRatio;
  setSelectedAspectRatio: (val: AspectRatio) => void;
  selectedStyle: VisualStyle;
  setSelectedStyle: (val: VisualStyle) => void;
  onApplyPromptPlan?: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  setPrompt,
  selectedDuration,
  setSelectedDuration,
  selectedAspectRatio,
  setSelectedAspectRatio,
  selectedStyle,
  setSelectedStyle,
}) => {
  // Parse prompt in real time
  const parseResult = useMemo(() => {
    return parsePromptClient(prompt, selectedDuration);
  }, [prompt, selectedDuration]);

  const samplePrompts = [
    {
      title: 'Mars Astronaut',
      text: 'A cinematic astronaut exploring Mars dunes during a sandstorm, duration 45 seconds, 16:9 widescreen.',
      duration: 45,
      aspect: '16:9' as AspectRatio,
      style: 'cinematic' as VisualStyle,
    },
    {
      title: 'Cyberpunk Metropolis',
      text: 'Futuristic surveillance drone weaving through neon-lit rainy skyscraper alleys, duration 30 seconds, 9:16 vertical.',
      duration: 30,
      aspect: '9:16' as AspectRatio,
      style: 'cinematic' as VisualStyle,
    },
    {
      title: 'Nordic Aurora',
      text: 'Breathtaking time-lapse of emerald aurora borealis swirling over snow peaks and frozen lake, duration 20s, 16:9 documentary.',
      duration: 20,
      aspect: '16:9' as AspectRatio,
      style: 'documentary' as VisualStyle,
    },
    {
      title: 'Mythic Phoenix',
      text: 'A majestic golden phoenix rising from volcanic obsidian ash with glowing ember trails, duration 15 seconds, 1:1 square fantasy.',
      duration: 15,
      aspect: '1:1' as AspectRatio,
      style: 'fantasy' as VisualStyle,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <label htmlFor="prompt-input" className="text-sm font-semibold text-white">
            Natural-Language Video Prompt & Duration
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Describe your scenes, camera movements, and desired duration in plain English (e.g. &ldquo;duration 45 seconds&rdquo;).
          </p>
        </div>

        {/* Quick sample prompt buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Samples:
          </span>
          {samplePrompts.map((sample) => (
            <button
              key={sample.title}
              type="button"
              onClick={() => {
                setPrompt(sample.text);
                setSelectedDuration(sample.duration);
                setSelectedAspectRatio(sample.aspect);
                setSelectedStyle(sample.style);
              }}
              className="rounded-md border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-500/50 hover:bg-slate-700/80 hover:text-white transition-all whitespace-nowrap"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Prompt Textarea */}
      <div className="relative">
        <textarea
          id="prompt-input"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A cinematic astronaut exploring the red surface of Mars, duration 45 seconds, vertical 9:16..."
          className="w-full resize-y rounded-lg border border-slate-700/90 bg-[#090d16] p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed font-sans"
        />
      </div>

      {/* Real-time duration & property indicator strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 flex-wrap">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            {parseResult.detectedDuration ? (
              <span className="text-cyan-300">
                Detected duration in prompt:{' '}
                <strong className="font-mono tabular-nums text-white">
                  {parseResult.detectedDuration}s
                </strong>
                {parseResult.detectedDurationText && (
                  <span className="text-slate-500 ml-1">({parseResult.detectedDurationText})</span>
                )}
              </span>
            ) : (
              <span className="text-slate-400">
                No duration in text · using duration setting ({selectedDuration}s)
              </span>
            )}
          </span>

          {parseResult.detectedAspectRatio && parseResult.detectedAspectRatio !== selectedAspectRatio && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setSelectedAspectRatio(parseResult.detectedAspectRatio!)}
                className="text-cyan-400 hover:underline"
              >
                Apply detected ratio ({parseResult.detectedAspectRatio})
              </button>
            </>
          )}

          {parseResult.detectedStyle && parseResult.detectedStyle !== selectedStyle && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => setSelectedStyle(parseResult.detectedStyle!)}
                className="text-cyan-400 hover:underline"
              >
                Apply detected style ({parseResult.detectedStyle})
              </button>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
          {prompt.length} characters
        </span>
      </div>

      {/* Duration Conflict Warning Banner */}
      {parseResult.hasConflictWithSelector && parseResult.detectedDuration && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-950/40 p-3.5 text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-100">Duration Conflict Detected: </span>
              Your prompt specifies <strong className="font-mono tabular-nums text-white">{parseResult.detectedDuration}s</strong>, 
              but the duration slider is currently set to <strong className="font-mono tabular-nums text-white">{selectedDuration}s</strong>.
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSelectedDuration(parseResult.detectedDuration!)}
              className="rounded-md bg-amber-400 px-2.5 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              Use Prompt ({parseResult.detectedDuration}s)
            </button>
            <button
              type="button"
              onClick={() => {
                // If user prefers selector, rewrite or accept selector
                const cleaned = parseResult.cleanedPrompt;
                setPrompt(cleaned ? `${cleaned}, duration ${selectedDuration}s` : prompt);
              }}
              className="rounded-md border border-amber-600/60 bg-amber-900/40 px-2.5 py-1 text-xs font-medium text-amber-200 hover:bg-amber-800/50 transition-colors whitespace-nowrap"
            >
              Keep Slider ({selectedDuration}s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
