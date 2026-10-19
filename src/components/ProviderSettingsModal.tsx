import React from 'react';
import { ProviderCapability } from '../types/index.ts';
import { ServerConfig } from '../services/api.ts';
import { Cpu, CheckCircle2, ShieldCheck, Key } from 'lucide-react';

interface ProviderSettingsProps {
  config: ServerConfig | null;
  onSelectProvider: (id: string) => Promise<void>;
  isUpdating: boolean;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsProps> = ({
  config,
  onSelectProvider,
  isUpdating,
}) => {
  if (!config) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          Connected Video Generation Engines & Capabilities
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          InfinityVideo AI operates a provider-independent orchestration engine. Real AI video generation requires configured provider credentials. We never falsely advertise unlimited free GPU compute.
        </p>
      </div>

      {/* Usage & Cost Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 text-xs">
          <span className="text-slate-400 block mb-0.5">Total Generation Seconds</span>
          <span className="font-mono text-base font-bold text-white tabular-nums">
            {config.usage.totalSeconds.toFixed(1)}s
          </span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 text-xs">
          <span className="text-slate-400 block mb-0.5">Estimated Incurred Cost</span>
          <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
            ${config.usage.totalCostUSD.toFixed(2)} USD
          </span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-3 text-xs">
          <span className="text-slate-400 block mb-0.5">Total Orchestrated Jobs</span>
          <span className="font-mono text-base font-bold text-cyan-400 tabular-nums">
            {config.usage.jobCount}
          </span>
        </div>
      </div>

      {/* Providers List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Configured Providers</h3>
        <div className="grid grid-cols-1 gap-4">
          {config.allProviders.map((provider) => {
            const isActive = config.activeProvider.id === provider.id;

            return (
              <div
                key={provider.id}
                className={`rounded-xl border p-5 transition-all ${
                  isActive
                    ? 'border-cyan-500 bg-[#0f172a] shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-[#0f172a]/60 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{provider.name}</h4>
                    {provider.isDemoMode ? (
                      <span className="rounded bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        Demo Mode
                      </span>
                    ) : provider.isConfigured ? (
                      <span className="rounded bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Credentials Active
                      </span>
                    ) : (
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        Requires Key ({provider.envKeyName})
                      </span>
                    )}
                  </div>

                  {/* Switch Active Provider button */}
                  {isActive ? (
                    <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Active Engine
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onSelectProvider(provider.id)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Set As Active Engine
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {provider.description}
                </p>

                {/* Capability Matrix Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Max Single Clip</span>
                    <span className="font-mono font-semibold text-slate-200 tabular-nums">
                      {provider.maxSingleClipDuration}s
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Max Total Duration</span>
                    <span className="font-mono font-semibold text-slate-200 tabular-nums">
                      {provider.maxTotalDuration}s ({(provider.maxTotalDuration / 60).toFixed(0)} min)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Pricing / Second</span>
                    <span className="font-mono font-semibold text-emerald-400 tabular-nums">
                      ${provider.costPerSecondUSD.toFixed(2)} USD
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Est. Queue Time</span>
                    <span className="font-mono font-semibold text-slate-200 tabular-nums">
                      ~{provider.queueEstimateSecondsPerClip}s / clip
                    </span>
                  </div>
                </div>

                {/* Setup guidance if key required */}
                {provider.requiresApiKey && !provider.isConfigured && (
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-[11px] text-slate-400 flex items-start gap-2">
                    <Key className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-300">How to configure: </span>
                      Set <code className="text-cyan-300 font-mono">{provider.envKeyName}</code> in your server environment or Secrets panel in AI Studio. The server will automatically detect the key upon restart.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Cost Policy Section */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 text-xs text-slate-400 space-y-2">
        <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          Safety & Cost Protection Policies
        </h4>
        <p className="leading-relaxed">
          InfinityVideo AI enforces strict budget caps, duration validation thresholds, and concurrency limits. 
          Long videos are broken down into individual scenes to prevent catastrophic re-run costs if a single frame fails. 
          Completed scenes are cached safely on the server and never re-rendered unnecessarily during retries.
        </p>
      </div>
    </div>
  );
};
