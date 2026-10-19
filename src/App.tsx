/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { PromptEditor } from './components/PromptEditor.tsx';
import { VideoSettings } from './components/VideoSettings.tsx';
import { StoryboardPlan } from './components/StoryboardPlan.tsx';
import { GenerationDashboard } from './components/GenerationDashboard.tsx';
import { ProjectLibrary } from './components/ProjectLibrary.tsx';
import { ProviderSettingsModal } from './components/ProviderSettingsModal.tsx';
import { DocumentationModal } from './components/DocumentationModal.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';

import { api, ServerConfig, PlanResponse } from './services/api.ts';
import { VideoProject, AspectRatio, VisualStyle } from './types/index.ts';
import { Film, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'library' | 'providers' | 'docs'>('studio');
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);

  // Form State
  const [prompt, setPrompt] = useState(
    'A cinematic astronaut exploring Mars, duration 15 seconds, 16:9 widescreen cinematic style.'
  );
  const [duration, setDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [style, setStyle] = useState<VisualStyle>('cinematic');
  const [resolution, setResolution] = useState('720p');
  const [fps, setFps] = useState(24);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [negativePrompt, setNegativePrompt] = useState('');

  // Blueprint Plan State
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isUpdatingProvider, setIsUpdatingProvider] = useState(false);

  // Polling ref for active project
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial server config & projects
  const loadInitialData = useCallback(async () => {
    try {
      const [cfg, projList] = await Promise.all([
        api.getConfig(),
        api.getProjects(),
      ]);
      setConfig(cfg);
      setProjects(projList);
      if (projList.length > 0 && !currentProject) {
        // Optionally have first completed project ready for preview
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [currentProject]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Debounced Plan Calculation
  useEffect(() => {
    if (!prompt.trim()) {
      setPlan(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsPlanning(true);
      try {
        const res = await api.planVideo({
          prompt,
          requestedDuration: duration,
          aspectRatio,
          style,
          providerId: config?.activeProvider.id,
        });
        setPlan(res);
      } catch (err) {
        console.error('Failed to plan video:', err);
      } finally {
        setIsPlanning(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [prompt, duration, aspectRatio, style, config?.activeProvider.id]);

  // Polling active generation
  useEffect(() => {
    if (!currentProject) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    const isRunning =
      currentProject.status === 'generating' ||
      currentProject.status === 'stitching' ||
      currentProject.status === 'queued';

    if (isRunning) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const updated = await api.getProject(currentProject.id);
          setCurrentProject(updated);

          // Also update in projects list
          setProjects((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );

          if (updated.status === 'completed' || updated.status === 'failed' || updated.status === 'cancelled') {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            // Refresh config usage
            api.getConfig().then(setConfig).catch(() => {});
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1500);
    } else {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [currentProject?.id, currentProject?.status]);

  // Start Generation Action
  const handleStartGeneration = async () => {
    if (!prompt.trim() || isStarting) return;
    setIsStarting(true);
    try {
      // 1. Create project draft
      const newProj = await api.createProject({
        prompt,
        requestedDuration: duration,
        aspectRatio,
        resolution,
        style,
        fps,
        seed,
        negativePrompt,
        providerId: config?.activeProvider.id,
      });

      // 2. Start generation
      const { project: startedProj } = await api.startGeneration(newProj.id);
      setCurrentProject(startedProj);
      setProjects((prev) => [startedProj, ...prev]);
      setActiveTab('studio');
    } catch (err: any) {
      alert(`Generation failed to start: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  // Retry Failed Scenes Action
  const handleRetry = async () => {
    if (!currentProject || isRetrying) return;
    setIsRetrying(true);
    try {
      const { project } = await api.retryGeneration(currentProject.id);
      setCurrentProject(project);
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  // Cancel Generation Action
  const handleCancel = async () => {
    if (!currentProject) return;
    try {
      const cancelled = await api.cancelGeneration(currentProject.id);
      setCurrentProject(cancelled);
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  // Delete Project Action
  const handleDeleteProject = async (id: string) => {
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  };

  // Rename Project Action
  const handleRenameProject = async (id: string, newTitle: string) => {
    const updated = await api.renameProject(id, newTitle);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (currentProject?.id === id) {
      setCurrentProject(updated);
    }
  };

  // Switch Active Provider
  const handleSelectProvider = async (providerId: string) => {
    setIsUpdatingProvider(true);
    try {
      await api.setActiveProvider(providerId);
      const updatedConfig = await api.getConfig();
      setConfig(updatedConfig);
    } catch (err: any) {
      alert(`Failed to set provider: ${err.message}`);
    } finally {
      setIsUpdatingProvider(false);
    }
  };

  const handleNewVideo = () => {
    setCurrentProject(null);
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewVideo={handleNewVideo}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* TAB 1: STUDIO VIEW */}
        {activeTab === 'studio' && (
          <>
            {/* If there's an active generating or completed project currently viewed */}
            {currentProject ? (
              <GenerationDashboard
                project={currentProject}
                onRetry={handleRetry}
                onCancel={handleCancel}
                onNewVideo={handleNewVideo}
                isRetrying={isRetrying}
              />
            ) : (
              <div className="space-y-8">
                {/* Hero Feature Showcase (using generated asset) */}
                <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a] shadow-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                    {/* Left text column */}
                    <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                          <Sparkles className="h-4 w-4" />
                          <span>Custom-Duration AI Video Generation</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
                          Any Prompt. Any Duration.{' '}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                            Seamless Multi-Clip Storyboards.
                          </span>
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                          Generate videos of flexible durations beyond standard model limits. 
                          InfinityVideo AI parses your prompt, calculates optimal scene cuts, 
                          maintains stylistic continuity, stitches clips with FFmpeg, and verifies actual media duration with FFprobe.
                        </p>
                      </div>

                      {/* Mechanism-to-outcome strip */}
                      <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Natural Parser</span>
                          <span className="font-semibold text-slate-200 mt-0.5 block">&ldquo;45 sec&rdquo;, &ldquo;2 min&rdquo;</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Clip Planning</span>
                          <span className="font-semibold text-slate-200 mt-0.5 block">Sub-second cuts</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Media Audit</span>
                          <span className="font-semibold text-cyan-400 mt-0.5 block">FFprobe Verified</span>
                        </div>
                      </div>
                    </div>

                    {/* Right hero image visual */}
                    <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-slate-950 overflow-hidden">
                      <img
                        src="/src/assets/images/hero_infinity_cinematic_1792412094826.jpg"
                        alt="Cinematic deep space nebula horizon"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#0f172a] lg:via-transparent lg:to-transparent" />
                      <div className="absolute bottom-3 right-3 rounded bg-black/70 backdrop-blur-md px-2 py-1 text-[10px] font-mono text-slate-300 border border-white/10">
                        16:9 Anamorphic Preview
                      </div>
                    </div>
                  </div>
                </section>

                {/* Main Studio Controls Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Prompt Editor & Video Parameters (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <PromptEditor
                      prompt={prompt}
                      setPrompt={setPrompt}
                      selectedDuration={duration}
                      setSelectedDuration={setDuration}
                      selectedAspectRatio={aspectRatio}
                      setSelectedAspectRatio={setAspectRatio}
                      selectedStyle={style}
                      setSelectedStyle={setStyle}
                    />

                    {config && (
                      <VideoSettings
                        duration={duration}
                        setDuration={setDuration}
                        aspectRatio={aspectRatio}
                        setAspectRatio={setAspectRatio}
                        style={style}
                        setStyle={setStyle}
                        resolution={resolution}
                        setResolution={setResolution}
                        fps={fps}
                        setFps={setFps}
                        seed={seed}
                        setSeed={setSeed}
                        negativePrompt={negativePrompt}
                        setNegativePrompt={setNegativePrompt}
                        activeProvider={config.activeProvider}
                        onOpenProviderModal={() => setActiveTab('providers')}
                      />
                    )}
                  </div>

                  {/* Right Column: Live Storyboard Blueprint & Generation Trigger (5 cols) */}
                  <div className="lg:col-span-5 space-y-6 sticky top-24">
                    <StoryboardPlan
                      plan={plan}
                      loading={isPlanning}
                      onStartGeneration={handleStartGeneration}
                      isStarting={isStarting}
                      requestedDuration={duration}
                    />

                    {/* Pre-seeded demo video quick showcase if exists */}
                    {projects.length > 0 && projects[0].status === 'completed' && (
                      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 p-4 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <Film className="h-3.5 w-3.5 text-cyan-400" />
                            Recent Completed Generation
                          </span>
                          <button
                            onClick={() => setCurrentProject(projects[0])}
                            className="text-cyan-400 hover:underline text-[11px]"
                          >
                            Inspect video →
                          </button>
                        </div>
                        <p className="text-slate-400 text-[11px] truncate">
                          {projects[0].title} ({projects[0].actualDuration?.toFixed(1) || projects[0].requestedDuration}s)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: LIBRARY VIEW */}
        {activeTab === 'library' && (
          <ProjectLibrary
            projects={projects}
            onSelectProject={(p) => {
              setCurrentProject(p);
              setActiveTab('studio');
            }}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            onNewVideo={handleNewVideo}
          />
        )}

        {/* TAB 3: PROVIDERS VIEW */}
        {activeTab === 'providers' && (
          <ProviderSettingsModal
            config={config}
            onSelectProvider={handleSelectProvider}
            isUpdating={isUpdatingProvider}
          />
        )}

        {/* TAB 4: DOCS VIEW */}
        {activeTab === 'docs' && <DocumentationModal />}
      </main>

      {/* Offline connectivity banner */}
      <OfflineBanner />

      {/* Footer conforming to anti-slop rules (quiet copyright and tech stack note) */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>InfinityVideo AI · Custom-Duration Video Orchestration Platform</span>
          <span className="text-[11px] text-slate-600">
            Powered by FFmpeg, FFprobe, and Pluggable Video Model Adapters
          </span>
        </div>
      </footer>
    </div>
  );
}
