import { VideoProject, ClipPlan } from '../../src/types/index.js';
import fs from 'fs/promises';
import path from 'path';

export interface UsageRecord {
  id: string;
  projectId: string;
  providerId: string;
  secondsGenerated: number;
  estimatedCostUSD: number;
  timestamp: string;
}

interface DatabaseSchema {
  projects: Record<string, VideoProject>;
  usage: UsageRecord[];
  config: {
    storageQuotaMB: number;
    cleanupMaxAgeDays: number;
    durationToleranceSeconds: number;
  };
}

const DB_PATH = path.resolve(process.cwd(), 'storage/db.json');

class Store {
  private data: DatabaseSchema = {
    projects: {},
    usage: [],
    config: {
      storageQuotaMB: 2048,
      cleanupMaxAgeDays: 7,
      durationToleranceSeconds: 1.0,
    },
  };
  private isLoaded = false;

  async init() {
    if (this.isLoaded) return;
    try {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      const raw = await fs.readFile(DB_PATH, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      // Create fresh DB and seed default sample project
      await this.seedSampleProject();
      await this.save();
    }
    this.isLoaded = true;
  }

  private async seedSampleProject() {
    const sampleId = 'sample-mars-astronaut';
    const clips: ClipPlan[] = [
      {
        id: 'clip-1-mars',
        projectId: sampleId,
        sceneIndex: 0,
        title: 'Scene 1: Descent onto Red Dunes',
        sceneDescription: 'Camera tracks solitary astronaut boots landing on red Martian dust dunes with solar lens flare.',
        prompt: 'A solitary astronaut in an advanced white spacesuit walking on the red sand dunes of Mars, dramatic dust storm on the horizon, golden sun flare, photorealistic IMAX documentary style. Scene 1 - Establish environment. Camera: Wide establishing shot, slow ambient push-in.',
        continuityPrompt: 'Style: cinematic, Aspect Ratio: 16:9. Consistent Martian atmospheric haze and copper horizon.',
        cameraMovement: 'Wide establishing shot, slow ambient push-in',
        plannedDuration: 5.0,
        actualDuration: 5.0,
        status: 'completed',
        progress: 100,
        videoUrl: '/storage/sample/sample_clip_1.mp4',
      },
      {
        id: 'clip-2-mars',
        projectId: sampleId,
        sceneIndex: 1,
        title: 'Scene 2: Atmospheric Scanner Interaction',
        sceneDescription: 'Astronaut activates wrist-mounted sensor beam scanning rocky crater formations.',
        prompt: 'Astronaut inspecting high-tech holographic scanning device over Martian rock crevices, red soil kicking up in the wind. Camera: Medium tracking shot following central action, smooth dolly.',
        continuityPrompt: 'Style: cinematic, Aspect Ratio: 16:9. Consistent Martian atmospheric haze and copper horizon.',
        cameraMovement: 'Medium tracking shot following central action, smooth dolly',
        plannedDuration: 5.0,
        actualDuration: 5.0,
        status: 'completed',
        progress: 100,
        videoUrl: '/storage/sample/sample_clip_2.mp4',
      },
      {
        id: 'clip-3-mars',
        projectId: sampleId,
        sceneIndex: 2,
        title: 'Scene 3: Horizon Reveal at Sunset',
        sceneDescription: 'Astronaut reaches ridge crest overlooking vast canyon under twin moons.',
        prompt: 'Epic wide panorama of astronaut standing on high Martian cliff overlooking Olympus Mons basin during blue sunset. Camera: Steady forward tracking with shallow depth of field.',
        continuityPrompt: 'Style: cinematic, Aspect Ratio: 16:9. Consistent Martian atmospheric haze and copper horizon.',
        cameraMovement: 'Steady forward tracking with shallow depth of field',
        plannedDuration: 5.0,
        actualDuration: 5.0,
        status: 'completed',
        progress: 100,
        videoUrl: '/storage/sample/sample_clip_3.mp4',
      },
    ];

    const sampleProject: VideoProject = {
      id: sampleId,
      title: 'Cinematic Astronaut Exploring Mars',
      prompt: 'A cinematic astronaut exploring Mars, duration 15 seconds, 16:9 widescreen cinematic style.',
      requestedDuration: 15.0,
      plannedDuration: 15.0,
      actualDuration: 15.0,
      durationDifference: 0.0,
      isDurationValid: true,
      aspectRatio: '16:9',
      resolution: '720p',
      style: 'cinematic',
      fps: 24,
      status: 'completed',
      progress: 100,
      clips,
      providerId: 'demo-procedural',
      finalVideoUrl: '/storage/sample/sample_mars_stitched.mp4',
      finalVideoSize: 3450000,
      durationTolerance: 1.0,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    };

    this.data.projects[sampleId] = sampleProject;
  }

  private async save() {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save db.json:', err);
    }
  }

  async getAllProjects(): Promise<VideoProject[]> {
    await this.init();
    return Object.values(this.data.projects).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProject(id: string): Promise<VideoProject | undefined> {
    await this.init();
    return this.data.projects[id];
  }

  async saveProject(project: VideoProject): Promise<void> {
    await this.init();
    project.updatedAt = new Date().toISOString();
    this.data.projects[project.id] = project;
    await this.save();
  }

  async deleteProject(id: string): Promise<boolean> {
    await this.init();
    if (!this.data.projects[id]) return false;
    delete this.data.projects[id];
    await this.save();

    // Clean up project storage folder
    const projectDir = path.resolve(process.cwd(), 'storage/projects', id);
    const clipsDir = path.resolve(process.cwd(), 'storage/clips', id);
    await fs.rm(projectDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(clipsDir, { recursive: true, force: true }).catch(() => {});
    return true;
  }

  async updateClip(projectId: string, clipId: string, updates: Partial<ClipPlan>): Promise<ClipPlan | undefined> {
    await this.init();
    const project = this.data.projects[projectId];
    if (!project) return undefined;
    const clipIndex = project.clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return undefined;

    project.clips[clipIndex] = { ...project.clips[clipIndex], ...updates };
    project.updatedAt = new Date().toISOString();
    await this.save();
    return project.clips[clipIndex];
  }

  async recordUsage(record: Omit<UsageRecord, 'id' | 'timestamp'>): Promise<void> {
    await this.init();
    this.data.usage.push({
      ...record,
      id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    });
    await this.save();
  }

  async getUsageStats(): Promise<{ totalSeconds: number; totalCostUSD: number; jobCount: number }> {
    await this.init();
    const totalSeconds = this.data.usage.reduce((sum, u) => sum + u.secondsGenerated, 0);
    const totalCostUSD = this.data.usage.reduce((sum, u) => sum + u.estimatedCostUSD, 0);
    return {
      totalSeconds,
      totalCostUSD: Math.round(totalCostUSD * 100) / 100,
      jobCount: this.data.usage.length,
    };
  }
}

export const store = new Store();
