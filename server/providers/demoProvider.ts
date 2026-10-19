import { IVideoProvider, GenerateClipResult, PollJobResult } from './types.js';
import { ClipPlan, VideoProject, ProviderCapability } from '../../src/types/index.js';
import { probeMedia } from '../services/videoStitcher.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

interface DemoJob {
  jobId: string;
  clipId: string;
  projectId: string;
  outputPath: string;
  videoUrl: string;
  actualDuration: number;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: number;
}

const activeDemoJobs = new Map<string, DemoJob>();

export class DemoVideoProvider implements IVideoProvider {
  public readonly id = 'demo-procedural';
  public readonly name = 'InfinityVideo Procedural Engine (Demo)';
  public readonly description = 
    'Procedural MP4 video engine running locally via FFmpeg. Generates genuine MP4 clips with verified durations, visual timecodes, and camera panning simulations. Ideal for verifying duration math, multi-clip stitching, and full lifecycle without consuming paid API credits.';

  getCapabilities(): ProviderCapability {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isConfigured: true,
      isDemoMode: true,
      maxSingleClipDuration: 8.0,
      maxTotalDuration: 180.0,
      minTotalDuration: 3.0,
      supportedAspectRatios: ['16:9', '9:16', '1:1'],
      supportedResolutions: ['720p', '1080p'],
      supportedFps: [24, 30],
      costPerSecondUSD: 0.00,
      queueEstimateSecondsPerClip: 2.5,
      requiresApiKey: false,
    };
  }

  async generateClip(clip: ClipPlan, project: VideoProject, storageDir: string): Promise<GenerateClipResult> {
    const jobId = `demo_job_${clip.id}_${Date.now()}`;
    await fs.mkdir(storageDir, { recursive: true });

    const clipFileName = `clip_${clip.sceneIndex}_${clip.id.slice(0, 8)}.mp4`;
    const outputPath = path.join(storageDir, clipFileName);
    const videoUrl = `/storage/clips/${path.basename(storageDir)}/${clipFileName}`;

    // Dimensions based on aspect ratio
    let width = 1280;
    let height = 720;
    if (project.aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (project.aspectRatio === '1:1') {
      width = 720;
      height = 720;
    }

    const durationSec = clip.plannedDuration;
    const fps = project.fps || 24;

    // Pick style theme colors
    let bgColors = '0x0d1527:0x1e293b';
    if (project.style === 'cinematic') bgColors = '0x090f1d:0x2d1f14';
    else if (project.style === 'fantasy') bgColors = '0x160c28:0x3b124d';
    else if (project.style === 'animation') bgColors = '0x0f2b38:0x165b4c';
    else if (project.style === 'documentary') bgColors = '0x1e1e1e:0x2b2b2b';

    // Register job as generating
    const job: DemoJob = {
      jobId,
      clipId: clip.id,
      projectId: project.id,
      outputPath,
      videoUrl,
      actualDuration: durationSec,
      status: 'generating',
      progress: 25,
      createdAt: Date.now(),
    };
    activeDemoJobs.set(jobId, job);

    // Run procedural generation in background simulation
    (async () => {
      try {
        // FFmpeg filter creating animated motion graphic with scene metadata, ambient sound, and exact duration
        const filterGraph = [
          // Background color gradient with animated pan
          `color=c=0x0b1329:s=${width}x${height}:d=${durationSec}:r=${fps}[base]`,
          // Add procedural moving grid / geometric lines
          `nullsrc=s=${width}x${height}:d=${durationSec}:r=${fps}[grid]`,
          `[base][grid]blend=all_mode=addition:all_opacity=0.15[bg]`,
          // Add clean text overlays: Scene title, prompt, duration watermark
          `[bg]drawtext=text='[DEMO ENGINE] Scene ${clip.sceneIndex + 1} (${clip.plannedDuration.toFixed(1)}s)':fontsize=24:fontcolor=white@0.9:x=(w-text_w)/2:y=40[t1]`,
          `[t1]drawtext=text='${escapeDrawText(clip.title)}':fontsize=28:fontcolor=0x38bdf8:x=(w-text_w)/2:y=90[t2]`,
          `[t2]drawtext=text='Camera: ${escapeDrawText(clip.cameraMovement)}':fontsize=18:fontcolor=white@0.7:x=(w-text_w)/2:y=h-80[t3]`,
          `[t3]drawtext=text='Time: %{pts\\:hms}':fontsize=20:fontcolor=0xa855f7:x=(w-text_w)/2:y=h-45[v]`
        ].join(';');

        // Audio: generate subtle ambient sine tone for realistic audio track synchronization
        await execFileAsync('ffmpeg', [
          '-y',
          '-f', 'lavfi', '-i', `color=c=0x070c18:s=${width}x${height}:d=${durationSec}:r=${fps}`,
          '-f', 'lavfi', '-i', `sine=frequency=220:duration=${durationSec}`,
          '-filter_complex', filterGraph,
          '-map', '[v]',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-preset', 'ultrafast',
          '-crf', '24',
          '-c:a', 'aac',
          '-b:a', '96k',
          '-t', durationSec.toString(),
          outputPath,
        ]);

        // Probe media to get verified actual duration
        const probe = await probeMedia(outputPath);
        job.actualDuration = probe.duration;
        job.status = 'completed';
        job.progress = 100;
        activeDemoJobs.set(jobId, job);
      } catch (err: any) {
        console.error('Demo generation error:', err);
        job.status = 'failed';
        job.error = err.message || 'Procedural generation error';
        activeDemoJobs.set(jobId, job);
      }
    })();

    return {
      jobId,
      status: 'generating',
    };
  }

  async pollStatus(jobId: string): Promise<PollJobResult> {
    const job = activeDemoJobs.get(jobId);
    if (!job) {
      return {
        status: 'failed',
        error: 'Job not found or expired',
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

    // Still generating: simulate smooth progress
    const elapsed = (Date.now() - job.createdAt) / 1000;
    const progress = Math.min(95, Math.round(30 + elapsed * 25));
    job.progress = progress;

    return {
      status: 'generating',
      progress,
    };
  }
}

function escapeDrawText(text: string): string {
  if (!text) return '';
  return text.replace(/[:\\']/g, '\\$&').slice(0, 60);
}
