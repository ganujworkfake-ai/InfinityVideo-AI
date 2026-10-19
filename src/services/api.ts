import { 
  VideoProject, 
  ProviderCapability, 
  ClipPlan, 
  ParsePromptResult,
  AspectRatio,
  VisualStyle 
} from '../types/index.ts';

export interface ServerConfig {
  activeProvider: ProviderCapability;
  allProviders: ProviderCapability[];
  usage: {
    totalSeconds: number;
    totalCostUSD: number;
    jobCount: number;
  };
  limits: {
    minDuration: number;
    maxDuration: number;
    defaultTolerance: number;
    maxClipsPerVideo: number;
  };
}

export interface PlanResponse {
  clips: ClipPlan[];
  plannedDuration: number;
  provider: ProviderCapability;
  estimatedCostUSD: number;
  estimatedQueueSeconds: number;
}

export const api = {
  async getConfig(): Promise<ServerConfig> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to fetch server config');
    return res.json();
  },

  async setActiveProvider(providerId: string): Promise<{ success: boolean; activeProvider: ProviderCapability }> {
    const res = await fetch('/api/config/active-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId }),
    });
    if (!res.ok) throw new Error('Failed to set active provider');
    return res.json();
  },

  async parsePrompt(prompt: string, currentSelectorDuration?: number): Promise<ParsePromptResult> {
    const res = await fetch('/api/parse-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, currentSelectorDuration }),
    });
    if (!res.ok) throw new Error('Failed to parse prompt');
    return res.json();
  },

  async planVideo(params: {
    prompt: string;
    requestedDuration: number;
    aspectRatio: AspectRatio;
    style: VisualStyle;
    providerId?: string;
  }): Promise<PlanResponse> {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to plan video');
    return res.json();
  },

  async getProjects(): Promise<VideoProject[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: string): Promise<VideoProject> {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async createProject(params: {
    prompt: string;
    requestedDuration: number;
    aspectRatio: AspectRatio;
    resolution: string;
    style: VisualStyle;
    fps?: number;
    seed?: number;
    negativePrompt?: string;
    providerId?: string;
    title?: string;
  }): Promise<VideoProject> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create project');
    }
    return res.json();
  },

  async startGeneration(id: string): Promise<{ message: string; project: VideoProject }> {
    const res = await fetch(`/api/projects/${id}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start generation');
    return res.json();
  },

  async retryGeneration(id: string): Promise<{ message: string; project: VideoProject }> {
    const res = await fetch(`/api/projects/${id}/retry`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to retry generation');
    return res.json();
  },

  async cancelGeneration(id: string): Promise<VideoProject> {
    const res = await fetch(`/api/projects/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel generation');
    return res.json();
  },

  async deleteProject(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  async renameProject(id: string, title: string): Promise<VideoProject> {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Failed to rename project');
    return res.json();
  },
};
