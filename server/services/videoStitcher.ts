import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface MediaProbeResult {
  duration: number; // in seconds
  size: number;     // in bytes
  bitrate?: number;
  width?: number;
  height?: number;
  codec?: string;
  fps?: number;
}

export interface StitchResult {
  outputPath: string;
  actualDuration: number;
  fileSizeBytes: number;
  isWithinTolerance: boolean;
  durationDifference: number;
}

/**
 * Inspects any video file with ffprobe to determine its precise actual duration and metadata
 */
export async function probeMedia(filePath: string): Promise<MediaProbeResult> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration,size,bit_rate:stream=width,height,codec_name,r_frame_rate',
      '-of', 'json',
      filePath,
    ]);

    const data = JSON.parse(stdout);
    const durationStr = data.format?.duration || (data.streams && data.streams[0]?.duration);
    const duration = parseFloat(durationStr || '0');
    const size = parseInt(data.format?.size || '0', 10);
    const bitrate = parseInt(data.format?.bit_rate || '0', 10);

    const videoStream = data.streams?.find((s: any) => s.codec_name && s.width);
    const width = videoStream?.width;
    const height = videoStream?.height;
    const codec = videoStream?.codec_name;

    let fps: number | undefined;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split('/');
      if (parts.length === 2 && parseFloat(parts[1]) > 0) {
        fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
      }
    }

    return {
      duration: Math.round(duration * 100) / 100,
      size,
      bitrate,
      width,
      height,
      codec,
      fps,
    };
  } catch (err: any) {
    console.error(`Error probing media file ${filePath}:`, err);
    throw new Error(`Media probe failed: ${err.message}`);
  }
}

/**
 * Stitches an array of normalized clip video files into one cohesive final MP4 video.
 * Validates the actual duration against the requested duration and configured tolerance.
 */
export async function stitchClips(
  clipPaths: string[],
  outputDirectory: string,
  requestedDuration: number,
  tolerance: number = 1.0
): Promise<StitchResult> {
  if (!clipPaths.length) {
    throw new Error('No clips provided for stitching');
  }

  await fs.mkdir(outputDirectory, { recursive: true });
  const finalOutputPath = path.join(outputDirectory, 'final_stitched.mp4');
  const concatListPath = path.join(outputDirectory, `concat_${Date.now()}.txt`);

  try {
    if (clipPaths.length === 1) {
      // Single clip: re-encode or copy to final output
      await execFileAsync('ffmpeg', [
        '-y',
        '-i', clipPaths[0],
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        finalOutputPath,
      ]);
    } else {
      // Multiple clips: generate concat file list
      const concatContent = clipPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
      await fs.writeFile(concatListPath, concatContent, 'utf-8');

      // Run FFmpeg concat demuxer
      await execFileAsync('ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        finalOutputPath,
      ]);

      // Clean up temp concat list
      await fs.unlink(concatListPath).catch(() => {});
    }

    // Inspect the stitched output with ffprobe to verify real media duration
    const probe = await probeMedia(finalOutputPath);
    const durationDifference = Math.round((probe.duration - requestedDuration) * 100) / 100;
    const isWithinTolerance = Math.abs(durationDifference) <= tolerance;

    return {
      outputPath: finalOutputPath,
      actualDuration: probe.duration,
      fileSizeBytes: probe.size,
      isWithinTolerance,
      durationDifference,
    };
  } catch (error: any) {
    await fs.unlink(concatListPath).catch(() => {});
    throw new Error(`Video stitching failed: ${error.message}`);
  }
}
