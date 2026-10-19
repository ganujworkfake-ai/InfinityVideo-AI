export type AspectRatio = '16:9' | '9:16' | '1:1';

export type VisualStyle = 
  | 'cinematic' 
  | 'realistic' 
  | 'animation' 
  | 'cartoon' 
  | 'fantasy' 
  | 'documentary';

export type ProjectStatus = 
  | 'draft' 
  | 'queued' 
  | 'generating' 
  | 'stitching' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type ClipStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ClipPlan {
  id: string;
  projectId: string;
  sceneIndex: number;
  title: string;
  sceneDescription: string;
  prompt: string;
  continuityPrompt: string;
  cameraMovement: string;
  plannedDuration: number; // in seconds, e.g. 5.0
  actualDuration?: number; // inspected duration from media
  status: ClipStatus;
  providerJobId?: string;
  videoUrl?: string;
  error?: string;
  progress: number; // 0 - 100
}

export interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  requestedDuration: number; // in seconds
  plannedDuration: number;   // sum of clips planned
  actualDuration?: number;   // verified by ffprobe
  durationDifference?: number; // actual - requested
  isDurationValid?: boolean;
  aspectRatio: AspectRatio;
  resolution: string;        // '720p' | '1080p'
  style: VisualStyle;
  fps: number;
  seed?: number;
  negativePrompt?: string;
  status: ProjectStatus;
  progress: number;          // 0 - 100
  clips: ClipPlan[];
  providerId: string;
  finalVideoUrl?: string;
  finalVideoSize?: number;
  durationTolerance: number; // default 1.0s
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderCapability {
  id: string;
  name: string;
  description: string;
  isConfigured: boolean;
  isDemoMode: boolean;
  maxSingleClipDuration: number; // in seconds (e.g. 6 or 8)
  maxTotalDuration: number;      // in seconds (e.g. 180)
  minTotalDuration: number;      // e.g. 3
  supportedAspectRatios: AspectRatio[];
  supportedResolutions: string[];
  supportedFps: number[];
  costPerSecondUSD: number;
  queueEstimateSecondsPerClip: number;
  requiresApiKey: boolean;
  envKeyName?: string;
}

export interface ParsePromptResult {
  detectedDuration?: number; // in seconds
  detectedDurationText?: string;
  detectedAspectRatio?: AspectRatio;
  detectedStyle?: VisualStyle;
  cleanedPrompt: string;
  rawPrompt: string;
  hasConflictWithSelector: boolean;
  conflictingSelectorDuration?: number;
}
