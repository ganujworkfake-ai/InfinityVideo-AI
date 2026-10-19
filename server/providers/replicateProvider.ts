import { IVideoProvider, GenerateClipResult, PollJobResult } from './types.js';
import { ClipPlan, VideoProject, ProviderCapability } from '../../src/types/index.js';
import { probeMedia } from '../services/videoStitcher.js';
import fs from 'fs/promises';
import path from 'path';

interface ReplicateJob {
  jobId: string;
  clipId: string;
  projectId: string;
  predictionId?: string;
  outputPath: string;
  videoUrl: string;
  actualDuration: number;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: number;
}

const activeReplicateJobs = new Map<string, ReplicateJob>();

export class ReplicateVideoProvider implements IVideoProvider {
  public readonly id = 'replicate-video';
  public readonly name = 'Replicate (Minimax / Luma / Wan)';
  public readonly description = 
    'Cloud-hosted video generation models via Replicate (e.g. Minimax Video-01, Wan2.1, Luma Ray). Supports 6-second clips per generation with cinematic aspect ratios.';

  private getApiToken(): string | undefined {
    return process.env.REPLICATE_API_TOKEN;
  }

  getCapabilities(): ProviderCapability {
    const hasToken = !!this.getApiToken();
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isConfigured: hasToken,
      isDemoMode: false,
      maxSingleClipDuration: 6.0,
      maxTotalDuration: 180.0,
      minTotalDuration: 3.0,
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      supportedResolutions: ['720p', '1080p'],
      supportedFps: [24, 25],
      costPerSecondUSD: 0.10,
      queueEstimateSecondsPerClip: 25.0,
      requiresApiKey: true,
      envKeyName: 'REPLICATE_API_TOKEN',
    };
  }

  async generateClip(clip: ClipPlan, project: VideoProject, storageDir: string): Promise<GenerateClipResult> {
    const token = this.getApiToken();
    if (!token) {
      throw new Error(
        'REPLICATE_API_TOKEN is not configured on the server. Set REPLICATE_API_TOKEN in your environment or use the InfinityVideo Procedural Demo Engine.'
      );
    }

    const jobId = `replicate_${clip.id}_${Date.now()}`;
    await fs.mkdir(storageDir, { recursive: true });

    const clipFileName = `replicate_clip_${clip.sceneIndex}_${clip.id.slice(0, 8)}.mp4`;
    const outputPath = path.join(storageDir, clipFileName);
    const videoUrl = `/storage/clips/${path.basename(storageDir)}/${clipFileName}`;

    const job: ReplicateJob = {
      jobId,
      clipId: clip.id,
      projectId: project.id,
      outputPath,
      videoUrl,
      actualDuration: clip.plannedDuration,
      status: 'generating',
      progress: 10,
      createdAt: Date.now(),
    };
    activeReplicateJobs.set(jobId, job);

    (async () => {
      try {
        // Create prediction on Replicate API
        const createRes = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Default model version for minimax/video-01 or zeroscope
            version: 'minimax/video-01',
            input: {
              prompt: clip.prompt,
              aspect_ratio: project.aspectRatio === '9:16' ? '9:16' : '16:9',
            },
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          throw new Error(`Replicate API error (${createRes.status}): ${errText}`);
        }

        const prediction = await createRes.json();
        job.predictionId = prediction.id;

        // Poll prediction until completed
        let currentPred = prediction;
        while (currentPred.status !== 'succeeded' && currentPred.status !== 'failed' && currentPred.status !== 'canceled') {
          await new Promise(r => setTimeout(r, 4000));
          const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${currentPred.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          currentPred = await pollRes.json();
          job.progress = Math.min(90, job.progress + 10);
        }

        if (currentPred.status === 'succeeded' && currentPred.output) {
          const videoDownloadUrl = Array.isArray(currentPred.output) ? currentPred.output[0] : currentPred.output;
          const downloadRes = await fetch(videoDownloadUrl);
          const buffer = Buffer.from(await downloadRes.arrayBuffer());
          await fs.writeFile(outputPath, buffer);

          const probe = await probeMedia(outputPath);
          job.actualDuration = probe.duration;
          job.status = 'completed';
          job.progress = 100;
        } else {
          throw new Error(currentPred.error || 'Replicate prediction failed or was cancelled');
        }
      } catch (err: any) {
        console.error('Replicate error:', err);
        job.status = 'failed';
        job.error = err.message || 'Replicate video generation failed';
      }
    })();

    return { jobId, status: 'generating' };
  }

  async pollStatus(jobId: string): Promise<PollJobResult> {
    const job = activeReplicateJobs.get(jobId);
    if (!job) {
      return { status: 'failed', error: 'Job not found', progress: 0 };
    }
    if (job.status === 'completed') {
      return {
        status: 'completed',
        videoPath: job.outputPath,
        videoUrl: job.videoUrl,
        actualDuration: job.actualDuration,
        progress: 100,
      };
    }
    if (job.status === 'failed') {
      return { status: 'failed', error: job.error, progress: 0 };
    }
    return { status: 'generating', progress: job.progress };
  }
}
