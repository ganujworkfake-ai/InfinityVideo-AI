import { ClipPlan, AspectRatio, VisualStyle } from '../../src/types/index.js';
import crypto from 'crypto';

interface PlanParams {
  projectId: string;
  prompt: string;
  requestedDuration: number; // seconds
  maxSingleClipDuration?: number; // default 6.0
  aspectRatio: AspectRatio;
  style: VisualStyle;
}

export function planVideoClips(params: PlanParams): { clips: ClipPlan[]; plannedDuration: number } {
  const {
    projectId,
    prompt,
    requestedDuration,
    maxSingleClipDuration = 6.0,
    aspectRatio,
    style,
  } = params;

  // Provider limit check: Minimum duration is 3 seconds, Max 180 seconds
  const clampedDuration = Math.max(3, Math.min(180, requestedDuration));

  // Determine number of clips needed
  let numClips = Math.ceil(clampedDuration / maxSingleClipDuration);
  if (numClips < 1) numClips = 1;

  // Calculate duration per clip
  const baseDuration = Math.floor((clampedDuration / numClips) * 10) / 10;
  const clips: ClipPlan[] = [];

  let accumulatedDuration = 0;

  // Standard cinematic camera movements to orchestrate scene continuity
  const cameraMovements = [
    'Wide establishing shot, slow ambient push-in',
    'Medium tracking shot following central action, smooth dolly',
    'Low-angle dynamic pan highlighting environment depth',
    'Close-up focus pull with atmospheric lighting',
    'Aerial sweeping overhead crane perspective',
    'Steady forward tracking with shallow depth of field',
    'Slow reverse pull-back revealing scale of the horizon',
  ];

  // Storyboard narrative arcs depending on clip index
  for (let i = 0; i < numClips; i++) {
    // For the last clip, make sure the sum equals clampedDuration exactly
    let clipDuration: number;
    if (i === numClips - 1) {
      clipDuration = Math.round((clampedDuration - accumulatedDuration) * 10) / 10;
    } else {
      clipDuration = baseDuration;
    }
    accumulatedDuration += clipDuration;

    const cameraMovement = cameraMovements[i % cameraMovements.length];

    let sceneRole = 'Introductory Scene';
    let narrativeArc = 'Establish setting, character posture, and ambient lighting.';
    if (numClips > 1) {
      if (i === 0) {
        sceneRole = 'Scene 1: Opening Shot';
        narrativeArc = 'Establish the expansive environment, character posture, and primary lighting mood.';
      } else if (i === numClips - 1) {
        sceneRole = `Scene ${i + 1}: Climax & Resolution`;
        narrativeArc = 'Dynamic conclusion revealing the wider consequence, settling camera into a striking finale.';
      } else if (i === 1) {
        sceneRole = `Scene ${i + 1}: Subject Action`;
        narrativeArc = 'Camera tracks subject movement as active engagement with the immediate environment occurs.';
      } else {
        sceneRole = `Scene ${i + 1}: Development`;
        narrativeArc = 'Shifting camera angle capturing intimate environmental interaction and particle dynamics.';
      }
    }

    // Continuity prompt ensures consistent color grading, lighting, and style
    const continuityPrompt = `Style: ${style}, Aspect Ratio: ${aspectRatio}. Consistent cinematic lighting, unified color grade, identical subject apparel and environmental geometry across cuts.`;

    const clipPrompt = `${prompt}. ${sceneRole} - ${narrativeArc}. Camera: ${cameraMovement}. ${continuityPrompt}`;

    clips.push({
      id: crypto.randomUUID(),
      projectId,
      sceneIndex: i,
      title: sceneRole,
      sceneDescription: narrativeArc,
      prompt: clipPrompt,
      continuityPrompt,
      cameraMovement,
      plannedDuration: clipDuration,
      status: 'pending',
      progress: 0,
    });
  }

  const plannedTotal = clips.reduce((sum, c) => sum + c.plannedDuration, 0);

  return {
    clips,
    plannedDuration: Math.round(plannedTotal * 10) / 10,
  };
}
