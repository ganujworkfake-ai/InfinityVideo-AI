import { IVideoProvider, GenerateClipResult, PollJobResult } from './types.js';
import { ClipPlan, VideoProject, ProviderCapability } from '../../src/types/index.js';
import { GoogleGenAI } from '@google/genai';
import { probeMedia } from '../services/videoStitcher.js';
import fs from 'fs/promises';
import path from 'path';

interface VeoJob {
  jobId: string;
  clipId: string;
  projectId: string;
  operationName?: string;
  outputPath: string;
  videoUrl: string;
  actualDuration: number;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: number;
}

const activeVeoJobs = new Map<string, VeoJob>();

export class GoogleVeoVideoProvider implements IVideoProvider {
  public readonly id = 'google-veo-2';
  public readonly name = 'Google Veo 2 / Gemini Video';
  public readonly description = 
    'Google DeepMind next-generation video model (Veo 2.0). Generates high-definition, photorealistic video clips with temporal consistency and cinematic camera controls. Requires GEMINI_API_KEY with Veo 2 access.';

  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  }

  getCapabilities(): ProviderCapability {
    const hasKey = !!this.getApiKey();
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isConfigured: hasKey,
      isDemoMode: false,
      maxSingleClipDuration: 6.0,
      maxTotalDuration: 180.0,
      minTotalDuration: 3.0,
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      supportedResolutions: ['720p', '1080p'],
      supportedFps: [24, 30],
      costPerSecondUSD: 0.15,
      queueEstimateSecondsPerClip: 12.0,
      requiresApiKey: true,
      envKeyName: 'GEMINI_API_KEY',
    };
  }

  async generateClip(clip: ClipPlan, project: VideoProject, storageDir: string): Promise<GenerateClipResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured on the server. Please configure it in your environment or use the InfinityVideo Procedural Demo Engine.'
      );
    }

    const jobId = `veo_job_${clip.id}_${Date.now()}`;
    await fs.mkdir(storageDir, { recursive: true });

    const clipFileName = `veo_clip_${clip.sceneIndex}_${clip.id.slice(0, 8)}.mp4`;
    const outputPath = path.join(storageDir, clipFileName);
    const videoUrl = `/storage/clips/${path.basename(storageDir)}/${clipFileName}`;

    const job: VeoJob = {
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
    activeVeoJobs.set(jobId, job);

    // Call @google/genai SDK asynchronously
    (async () => {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Check if operations/models.generateVideos is supported or invoke Veo
        // Using veo-2.0-generate-001 model
        const durationSeconds = Math.min(8, Math.max(3, Math.round(clip.plannedDuration)));

        // Initiate video generation
        // Note: Veo 2 uses generateVideos API
        let videoDataBuffer: Buffer | null = null;

        try {
          // Attempt using ai.models.generateVideos
          if ((ai as any).models && typeof (ai as any).models.generateVideos === 'function') {
            const operation = await (ai as any).models.generateVideos({
              model: 'veo-2.0-generate-001',
              prompt: clip.prompt,
              config: {
                aspectRatio: project.aspectRatio === '9:16' ? '9:16' : '16:9',
                durationSeconds: durationSeconds,
                fps: project.fps || 24,
              },
            });

            // Poll operation until completed
            let op = operation;
            while (!op.done) {
              await new Promise(r => setTimeout(r, 4000));
              op = await (ai as any).operations.getVideosOperation({ name: op.name });
              job.progress = Math.min(90, job.progress + 15);
              activeVeoJobs.set(jobId, job);
            }

            if (op.error) {
              throw new Error(`Veo generation error: ${op.error.message || JSON.stringify(op.error)}`);
            }

            const videoUri = op.response?.generatedVideos?.[0]?.video?.uri;
            if (videoUri) {
              // Fetch video buffer from download URI
              const res = await fetch(videoUri, {
                headers: { 'x-goog-api-key': apiKey },
              });
              const arrayBuffer = await res.arrayBuffer();
              videoDataBuffer = Buffer.from(arrayBuffer);
            }
          }
        } catch (apiError: any) {
          console.warn('Veo 2 API call encountered error:', apiError?.message || apiError);
          // If the model is not yet provisioned on this specific project key, provide informative error
          throw new Error(
            `Google Veo 2 API responded: ${apiError.message || 'Model access restricted'}. Please ensure your Google Cloud / AI Studio project has Veo 2 model access enabled, or switch to the Procedural Demo Engine.`
          );
        }

        if (videoDataBuffer) {
          await fs.writeFile(outputPath, videoDataBuffer);
          const probe = await probeMedia(outputPath);
          job.actualDuration = probe.duration;
          job.status = 'completed';
          job.progress = 100;
          activeVeoJobs.set(jobId, job);
        } else {
          throw new Error('Veo API returned empty video payload');
        }
      } catch (err: any) {
        console.error('Google Veo Generation Error:', err);
        job.status = 'failed';
        job.error = err.message || 'Veo generation failed';
        activeVeoJobs.set(jobId, job);
      }
    })();

    return {
      jobId,
      status: 'generating',
    };
  }

  async pollStatus(jobId: string): Promise<PollJobResult> {
    const job = activeVeoJobs.get(jobId);
    if (!job) {
      return {
        status: 'failed',
        error: 'Veo job not found or expired',
        progress: 0,
      };
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
      return {
        status: 'failed',
        error: job.error,
        progress: 0,
      };
    }

    return {
      status: 'generating',
      progress: job.progress,
    };
  }
}
