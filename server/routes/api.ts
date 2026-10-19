import { Router, Request, Response } from 'express';
import { parsePrompt } from '../services/durationParser.js';
import { planVideoClips } from '../services/videoPlanner.js';
import { stitchClips } from '../services/videoStitcher.js';
import { providerRegistry } from '../providers/providerRegistry.js';
import { store } from '../db/store.js';
import { VideoProject, ClipPlan } from '../../src/types/index.js';
import crypto from 'crypto';
import path from 'path';

export const apiRouter = Router();

// Track background orchestrator intervals
const activeOrchestrators = new Map<string, NodeJS.Timeout>();

// GET /api/config
apiRouter.get('/config', async (_req: Request, res: Response) => {
  const activeProvider = providerRegistry.getActiveProvider();
  const allCapabilities = providerRegistry.getAllCapabilities();
  const usageStats = await store.getUsageStats();

  res.json({
    activeProvider: activeProvider.getCapabilities(),
    allProviders: allCapabilities,
    usage: usageStats,
    limits: {
      minDuration: 3,
      maxDuration: 180,
      defaultTolerance: 1.0,
      maxClipsPerVideo: 30,
    },
  });
});

// POST /api/config/active-provider
apiRouter.post('/config/active-provider', (req: Request, res: Response) => {
  const { providerId } = req.body;
  if (!providerId) {
    return res.status(400).json({ error: 'providerId is required' });
  }
  const success = providerRegistry.setActiveProvider(providerId);
  if (!success) {
    return res.status(404).json({ error: `Provider ${providerId} not found` });
  }
  const active = providerRegistry.getActiveProvider().getCapabilities();
  res.json({ success: true, activeProvider: active });
});

// POST /api/parse-prompt
apiRouter.post('/parse-prompt', (req: Request, res: Response) => {
  const { prompt, currentSelectorDuration } = req.body;
  const result = parsePrompt(prompt, currentSelectorDuration);
  res.json(result);
});

// POST /api/plan
apiRouter.post('/plan', (req: Request, res: Response) => {
  const { prompt, requestedDuration, aspectRatio = '16:9', style = 'cinematic', providerId } = req.body;

  const provider = providerId ? providerRegistry.get(providerId) : providerRegistry.getActiveProvider();
  const caps = provider ? provider.getCapabilities() : providerRegistry.getActiveProvider().getCapabilities();

  const plan = planVideoClips({
    projectId: 'preview-plan',
    prompt: prompt || 'Cinematic landscape',
    requestedDuration: parseFloat(requestedDuration) || 15.0,
    maxSingleClipDuration: caps.maxSingleClipDuration,
    aspectRatio,
    style,
  });

  const estimatedCost = Math.round(plan.plannedDuration * caps.costPerSecondUSD * 100) / 100;
  const estimatedQueueSec = Math.round(plan.clips.length * caps.queueEstimateSecondsPerClip);

  res.json({
    ...plan,
    provider: caps,
    estimatedCostUSD: estimatedCost,
    estimatedQueueSeconds: estimatedQueueSec,
  });
});

// GET /api/projects
apiRouter.get('/projects', async (_req: Request, res: Response) => {
  const projects = await store.getAllProjects();
  res.json(projects);
});

// GET /api/projects/:id
apiRouter.get('/projects/:id', async (req: Request, res: Response) => {
  const project = await store.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

// POST /api/projects (Create draft)
apiRouter.post('/projects', async (req: Request, res: Response) => {
  const {
    prompt,
    requestedDuration = 15,
    aspectRatio = '16:9',
    resolution = '720p',
    style = 'cinematic',
    fps = 24,
    seed,
    negativePrompt,
    providerId,
    title,
  } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Valid prompt is required' });
  }

  const duration = Math.max(3, Math.min(180, parseFloat(requestedDuration) || 15));
  const provider = providerId ? providerRegistry.get(providerId) : providerRegistry.getActiveProvider();
  const activeProvId = provider ? provider.id : providerRegistry.getActiveProvider().id;
  const caps = provider ? provider.getCapabilities() : providerRegistry.getActiveProvider().getCapabilities();

  const projectId = `proj_${crypto.randomUUID().slice(0, 8)}`;
  const plan = planVideoClips({
    projectId,
    prompt,
    requestedDuration: duration,
    maxSingleClipDuration: caps.maxSingleClipDuration,
    aspectRatio,
    style,
  });

  // Generate a clean title if not provided
  const generatedTitle = title || prompt.split(/[,.]/)[0].slice(0, 40).trim() || 'Untitled Video';

  const newProject: VideoProject = {
    id: projectId,
    title: generatedTitle,
    prompt,
    requestedDuration: duration,
    plannedDuration: plan.plannedDuration,
    aspectRatio,
    resolution,
    style,
    fps,
    seed,
    negativePrompt,
    status: 'draft',
    progress: 0,
    clips: plan.clips,
    providerId: activeProvId,
    durationTolerance: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await store.saveProject(newProject);
  res.status(201).json(newProject);
});

// PATCH /api/projects/:id (Rename or update metadata)
apiRouter.patch('/api/projects/:id', async (req: Request, res: Response) => {
  const project = await store.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.body.title) project.title = req.body.title.trim();
  await store.saveProject(project);
  res.json(project);
});

// DELETE /api/projects/:id
apiRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  // Cancel active orchestrator if running
  const timer = activeOrchestrators.get(req.params.id);
  if (timer) {
    clearInterval(timer);
    activeOrchestrators.delete(req.params.id);
  }

  const success = await store.deleteProject(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ success: true, message: 'Project and all associated media files deleted' });
});

// POST /api/projects/:id/cancel
apiRouter.post('/projects/:id/cancel', async (req: Request, res: Response) => {
  const project = await store.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const timer = activeOrchestrators.get(project.id);
  if (timer) {
    clearInterval(timer);
    activeOrchestrators.delete(project.id);
  }

  project.status = 'cancelled';
  project.error = 'Generation was cancelled by the user.';
  await store.saveProject(project);

  res.json(project);
});

// POST /api/projects/:id/start (Run or Resume generation job)
apiRouter.post('/projects/:id/start', async (req: Request, res: Response) => {
  const project = await store.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (project.status === 'generating' || project.status === 'stitching') {
    return res.json({ message: 'Project already running', project });
  }

  project.status = 'generating';
  project.error = undefined;
  await store.saveProject(project);

  // Trigger orchestration asynchronously
  runProjectOrchestration(project.id).catch(err => {
    console.error(`Orchestration error for project ${project.id}:`, err);
  });

  res.json({ message: 'Generation started', project });
});

// POST /api/projects/:id/retry (Retry only failed clips)
apiRouter.post('/projects/:id/retry', async (req: Request, res: Response) => {
  const project = await store.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // Reset only failed clips
  project.clips = project.clips.map(clip => {
    if (clip.status === 'failed') {
      return {
        ...clip,
        status: 'pending',
        error: undefined,
        progress: 0,
        providerJobId: undefined,
      };
    }
    return clip;
  });

  project.status = 'generating';
  project.error = undefined;
  await store.saveProject(project);

  runProjectOrchestration(project.id).catch(err => {
    console.error(`Retry orchestration error for project ${project.id}:`, err);
  });

  res.json({ message: 'Retrying failed clips', project });
});

/**
 * Background Orchestrator Engine:
 * - Submits pending clips to active provider adapter
 * - Polls progress
 * - Resumes without duplicate regeneration
 * - Stitches all clips when complete
 * - Inspects and validates real media duration with FFprobe
 */
async function runProjectOrchestration(projectId: string) {
  const project = await store.getProject(projectId);
  if (!project) return;

  const provider = providerRegistry.get(project.providerId) || providerRegistry.getActiveProvider();
  const clipsStorageDir = path.resolve(process.cwd(), 'storage/clips', projectId);
  const projectStorageDir = path.resolve(process.cwd(), 'storage/projects', projectId);

  // 1. Submit all pending clips
  for (const clip of project.clips) {
    if (clip.status === 'pending') {
      try {
        clip.status = 'generating';
        clip.progress = 15;
        await store.saveProject(project);

        const result = await provider.generateClip(clip, project, clipsStorageDir);
        clip.providerJobId = result.jobId;
        if (result.status === 'completed' && result.videoUrl) {
          clip.status = 'completed';
          clip.videoUrl = result.videoUrl;
          clip.actualDuration = result.actualDuration || clip.plannedDuration;
          clip.progress = 100;
        }
        await store.saveProject(project);
      } catch (err: any) {
        clip.status = 'failed';
        clip.error = err.message || 'Generation submission failed';
        await store.saveProject(project);
      }
    }
  }

  // 2. Start polling loop for pending / generating clips
  const timer = setInterval(async () => {
    const currentProj = await store.getProject(projectId);
    if (!currentProj || currentProj.status === 'cancelled') {
      clearInterval(timer);
      activeOrchestrators.delete(projectId);
      return;
    }

    let allDone = true;
    let anyFailed = false;

    for (const clip of currentProj.clips) {
      if (clip.status === 'generating' && clip.providerJobId) {
        allDone = false;
        try {
          const poll = await provider.pollStatus(clip.providerJobId);
          clip.progress = poll.progress;

          if (poll.status === 'completed') {
            clip.status = 'completed';
            clip.videoUrl = poll.videoUrl;
            clip.actualDuration = poll.actualDuration || clip.plannedDuration;
            clip.progress = 100;
          } else if (poll.status === 'failed') {
            clip.status = 'failed';
            clip.error = poll.error || 'Clip generation failed';
            anyFailed = true;
          }
        } catch (pollErr: any) {
          clip.status = 'failed';
          clip.error = pollErr.message;
          anyFailed = true;
        }
      } else if (clip.status === 'failed') {
        anyFailed = true;
      } else if (clip.status === 'pending') {
        allDone = false;
      }
    }

    // Calculate overall project progress
    const totalProgress = currentProj.clips.reduce((sum, c) => sum + (c.progress || 0), 0);
    currentProj.progress = Math.round(totalProgress / currentProj.clips.length);
    await store.saveProject(currentProj);

    if (anyFailed) {
      clearInterval(timer);
      activeOrchestrators.delete(projectId);
      currentProj.status = 'failed';
      currentProj.error = 'One or more scenes failed to generate. You can retry failed scenes without losing completed ones.';
      await store.saveProject(currentProj);
      return;
    }

    if (allDone) {
      clearInterval(timer);
      activeOrchestrators.delete(projectId);

      // Transition to Stitching Stage
      currentProj.status = 'stitching';
      currentProj.progress = 92;
      await store.saveProject(currentProj);

      try {
        // Collect disk file paths of all clips in order
        const clipFilePaths = currentProj.clips.map(c => {
          // c.videoUrl is like /storage/clips/:projectId/:filename
          const filename = path.basename(c.videoUrl || '');
          return path.join(clipsStorageDir, filename);
        });

        // Run FFmpeg stitching and duration validation
        const stitchResult = await stitchClips(
          clipFilePaths,
          projectStorageDir,
          currentProj.requestedDuration,
          currentProj.durationTolerance
        );

        currentProj.status = 'completed';
        currentProj.progress = 100;
        currentProj.actualDuration = stitchResult.actualDuration;
        currentProj.durationDifference = stitchResult.durationDifference;
        currentProj.isDurationValid = stitchResult.isWithinTolerance;
        currentProj.finalVideoSize = stitchResult.fileSizeBytes;
        currentProj.finalVideoUrl = `/storage/projects/${projectId}/${path.basename(stitchResult.outputPath)}`;

        // Record usage
        await store.recordUsage({
          projectId,
          providerId: currentProj.providerId,
          secondsGenerated: stitchResult.actualDuration,
          estimatedCostUSD: Math.round(stitchResult.actualDuration * (provider.getCapabilities().costPerSecondUSD || 0) * 100) / 100,
        });

        await store.saveProject(currentProj);
      } catch (stitchErr: any) {
        console.error(`Stitching failed for project ${projectId}:`, stitchErr);
        currentProj.status = 'failed';
        currentProj.error = `Video stitching and duration validation failed: ${stitchErr.message}`;
        await store.saveProject(currentProj);
      }
    }
  }, 1500);

  activeOrchestrators.set(projectId, timer);
}
