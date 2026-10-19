import { ClipPlan, VideoProject, ProviderCapability } from '../../src/types/index.js';

export interface GenerateClipResult {
  jobId: string;
  status: 'generating' | 'completed';
  videoPath?: string;
  videoUrl?: string;
  actualDuration?: number;
}

export interface PollJobResult {
  status: 'generating' | 'completed' | 'failed';
  videoPath?: string;
  videoUrl?: string;
  actualDuration?: number;
  progress: number;
  error?: string;
}

export interface IVideoProvider {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  getCapabilities(): ProviderCapability;
  generateClip(clip: ClipPlan, project: VideoProject, storageDir: string): Promise<GenerateClipResult>;
  pollStatus(jobId: string): Promise<PollJobResult>;
  cancelJob?(jobId: string): Promise<void>;
}
