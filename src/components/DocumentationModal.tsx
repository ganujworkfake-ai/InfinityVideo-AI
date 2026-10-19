import React, { useState } from 'react';
import { BookOpen, Terminal, Shield, Layers, Server, Cloud } from 'lucide-react';

export const DocumentationModal: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'setup' | 'providers' | 'security' | 'deploy'>('architecture');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          Technical Documentation & Architecture Guide
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete engineering guide for InfinityVideo AI: Custom duration orchestration, FFmpeg media normalization, provider adapters, and production deployment.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection('architecture')}
          className={`pb-2 whitespace-nowrap transition-colors ${
            activeSection === 'architecture' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. System Architecture
        </button>
        <button
          onClick={() => setActiveSection('setup')}
          className={`pb-2 whitespace-nowrap transition-colors ${
            activeSection === 'setup' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Local Setup & Testing
        </button>
        <button
          onClick={() => setActiveSection('providers')}
          className={`pb-2 whitespace-nowrap transition-colors ${
            activeSection === 'providers' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Provider Adapters
        </button>
        <button
          onClick={() => setActiveSection('security')}
          className={`pb-2 whitespace-nowrap transition-colors ${
            activeSection === 'security' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Security & Idempotency
        </button>
        <button
          onClick={() => setActiveSection('deploy')}
          className={`pb-2 whitespace-nowrap transition-colors ${
            activeSection === 'deploy' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          5. Free-Tier Deployment
        </button>
      </div>

      {/* Section 1: Architecture */}
      {activeSection === 'architecture' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-cyan-400" />
              Duration-Aware Multi-Clip Pipeline
            </h4>
            <p className="leading-relaxed">
              Standard AI video models (e.g. Veo, Runway, Luma) support clips between 4 to 8 seconds. 
              InfinityVideo AI breaks the barrier by executing a four-stage orchestration pipeline:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Natural Language Parser:</strong> Extracts duration entities (e.g., &ldquo;45 seconds&rdquo;, &ldquo;2 mins&rdquo;) and reconciles conflicts with UI inputs.
              </li>
              <li>
                <strong className="text-white">Storyboard Scene Division:</strong> Calculates optimal clip count (N = Duration / ClipMax), distributing duration down to the millisecond so the sum of clip durations equals the requested duration. Generates continuity prompts and camera directions for scene-to-scene cohesion.
              </li>
              <li>
                <strong className="text-white">Asynchronous Job Orchestrator:</strong> Issues jobs through the active provider adapter. If a scene fails, only the failed scene is retried—preserving successful clips.
              </li>
              <li>
                <strong className="text-white">FFmpeg Assembly & Duration Audit:</strong> Concatenates normalized clips using FFmpeg and inspects the output with <code className="text-cyan-300">ffprobe</code> to verify that the actual media duration matches requested duration within tolerance (±1.0s).
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-2 font-mono text-[11px]">
            <span className="text-slate-400 block font-sans font-semibold text-xs">Directory & Module Structure:</span>
            <pre className="text-slate-300 overflow-x-auto p-2 bg-[#090d16] rounded border border-slate-800/80">
{`server.ts                 # Express server + Vite middlewares (Full-Stack SPA)
server/
  services/
    durationParser.ts     # Natural language regex & duration entity extraction
    videoPlanner.ts       # Storyboard clip division & continuity generator
    videoStitcher.ts      # FFmpeg concat demuxer & FFprobe duration validator
  providers/
    types.ts              # Pluggable IVideoProvider interface
    demoProvider.ts       # Procedural FFmpeg engine for offline testing
    veoProvider.ts        # Google Veo 2 / Gemini Video adapter
    replicateProvider.ts  # Replicate (Minimax / Luma / Wan) adapter
    providerRegistry.ts   # Provider selection & capabilities catalog
  db/
    store.ts              # Persistent JSON database with storage quotas
src/
  components/             # Modern SaaS UI components with zero-pill discipline
  hooks/                  # PWA installation & online status hooks
  types/                  # Shared TypeScript data models`}
            </pre>
          </div>
        </div>
      )}

      {/* Section 2: Setup */}
      {activeSection === 'setup' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              Local Development Setup
            </h4>
            <div className="space-y-2">
              <span className="text-slate-400">1. Clone & install dependencies:</span>
              <pre className="bg-[#090d16] p-2.5 rounded border border-slate-800 text-cyan-300 font-mono">
                npm install
              </pre>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400">2. Verify system ffmpeg and ffprobe:</span>
              <pre className="bg-[#090d16] p-2.5 rounded border border-slate-800 text-cyan-300 font-mono">
                ffmpeg -version && ffprobe -version
              </pre>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400">3. Launch development server:</span>
              <pre className="bg-[#090d16] p-2.5 rounded border border-slate-800 text-cyan-300 font-mono">
                npm run dev
              </pre>
              <p className="text-[11px] text-slate-400">
                Spawns the Express backend with Vite HMR middleware mounted at <code className="text-cyan-400">http://localhost:3000</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Providers */}
      {activeSection === 'providers' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Server className="h-4 w-4 text-cyan-400" />
              Provider Credentials & Configuration
            </h4>
            <p className="leading-relaxed">
              To connect real AI video generation, configure the server environment variables in your <code className="text-cyan-300">.env</code>:
            </p>
            <pre className="bg-[#090d16] p-3 rounded border border-slate-800 text-slate-200 font-mono leading-relaxed">
{`# Google Veo 2 / Gemini Video
GEMINI_API_KEY="AIzaSy..."

# Replicate (Minimax Video-01, Wan, Luma Ray)
REPLICATE_API_TOKEN="r8_..."

# Application Public URL
APP_URL="http://localhost:3000"`}
            </pre>
            <p className="text-[11px] text-slate-400">
              When credentials are not present, InfinityVideo AI defaults to the <strong>Procedural Demo Engine</strong> so you can test complete multi-clip assembly, duration verification, retry mechanisms, and downloads without incurring external billing.
            </p>
          </div>
        </div>
      )}

      {/* Section 4: Security */}
      {activeSection === 'security' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-cyan-400" />
              Security & Cost Control Checklist
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 leading-relaxed">
              <li><strong className="text-white">Zero Secrets in Client:</strong> All API keys (<code className="text-cyan-300">GEMINI_API_KEY</code>, <code className="text-cyan-300">REPLICATE_API_TOKEN</code>) are accessed exclusively on the Node.js backend.</li>
              <li><strong className="text-white">Idempotent Retries:</strong> Scene clips are tagged with unique job IDs. Retrying a failed project only re-submits failed clips, avoiding duplicate charges.</li>
              <li><strong className="text-white">Duration Upper Bound:</strong> Hard maximum total duration of 180 seconds to prevent runaway GPU billing.</li>
              <li><strong className="text-white">Strict Concurrency:</strong> Background orchestrator manages active polling and gracefully terminates on user cancellation.</li>
              <li><strong className="text-white">Safe Media Sanitization:</strong> FFmpeg arguments use safe parameter arrays (`execFile`) to prevent shell injection vulnerabilities.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Section 5: Deploy */}
      {activeSection === 'deploy' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-slate-800 bg-[#0f172a] p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Cloud className="h-4 w-4 text-cyan-400" />
              Free-Tier Deployment Guide (Google Cloud Run / Render / Fly.io)
            </h4>
            <p className="leading-relaxed">
              InfinityVideo AI is containerized for seamless zero-downtime deployment:
            </p>
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold">Build & Run Commands:</span>
              <pre className="bg-[#090d16] p-2.5 rounded border border-slate-800 text-cyan-300 font-mono">
{`npm run build
npm start`}
              </pre>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In production mode, the server compiles frontend assets to <code className="text-cyan-300">dist/</code> and serves static files directly through Express with HTTP Range requests supported for smooth video scrubbing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
