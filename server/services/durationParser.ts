import { AspectRatio, VisualStyle, ParsePromptResult } from '../../src/types/index.js';

/**
 * Parses user prompts to extract duration, aspect ratio, visual style,
 * and identifies potential conflicts with manual UI selectors.
 */
export function parsePrompt(prompt: string, currentSelectorDuration?: number): ParsePromptResult {
  if (!prompt || typeof prompt !== 'string') {
    return {
      cleanedPrompt: '',
      rawPrompt: prompt || '',
      hasConflictWithSelector: false,
    };
  }

  let detectedDuration: number | undefined;
  let detectedDurationText: string | undefined;

  // Regex patterns for duration
  // Pattern 1: minutes + seconds like "1 min 30 sec", "2 minutes 15 seconds"
  const minSecMatch = prompt.match(/\b(\d+)\s*(?:min(?:ute)?s?)\s*(?:and\s*)?(\d+)\s*(?:sec(?:ond)?s?)\b/i);
  if (minSecMatch) {
    const mins = parseInt(minSecMatch[1], 10);
    const secs = parseInt(minSecMatch[2], 10);
    detectedDuration = mins * 60 + secs;
    detectedDurationText = minSecMatch[0];
  } else {
    // Pattern 2: decimal minutes like "1.5 minutes", "2.5 mins"
    const decimalMinMatch = prompt.match(/\b(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?|m)\b/i);
    if (decimalMinMatch && !prompt.match(/\b\d+\s*m(?:eter|ile)s?\b/i)) {
      const mins = parseFloat(decimalMinMatch[1]);
      detectedDuration = Math.round(mins * 60);
      detectedDurationText = decimalMinMatch[0];
    } else {
      // Pattern 3: seconds like "duration 45 seconds", "45 sec", "90 seconds", "30s"
      const secMatch = prompt.match(/\b(?:duration\s*:?\s*)?(\d+)\s*(?:seconds?|secs?|s)\b/i);
      if (secMatch) {
        detectedDuration = parseInt(secMatch[1], 10);
        detectedDurationText = secMatch[0];
      }
    }
  }

  // Detect Aspect Ratio
  let detectedAspectRatio: AspectRatio | undefined;
  if (/\b(?:vertical|portrait|9[:/]16)\b/i.test(prompt)) {
    detectedAspectRatio = '9:16';
  } else if (/\b(?:square|1[:/]1)\b/i.test(prompt)) {
    detectedAspectRatio = '1:1';
  } else if (/\b(?:horizontal|landscape|widescreen|16[:/]9)\b/i.test(prompt)) {
    detectedAspectRatio = '16:9';
  }

  // Detect Visual Style
  let detectedStyle: VisualStyle | undefined;
  if (/\bcinematic\b/i.test(prompt)) detectedStyle = 'cinematic';
  else if (/\brealistic|photorealistic|hyperrealistic\b/i.test(prompt)) detectedStyle = 'realistic';
  else if (/\banimation|anime\b/i.test(prompt)) detectedStyle = 'animation';
  else if (/\bcartoon\b/i.test(prompt)) detectedStyle = 'cartoon';
  else if (/\bfantasy\b/i.test(prompt)) detectedStyle = 'fantasy';
  else if (/\bdocumentary\b/i.test(prompt)) detectedStyle = 'documentary';

  // Conflict check: if prompt duration detected and user selector is different
  const hasConflict = 
    detectedDuration !== undefined &&
    currentSelectorDuration !== undefined &&
    Math.abs(detectedDuration - currentSelectorDuration) >= 1;

  // Clean prompt by stripping out mechanical duration specs for the AI generative text
  let cleaned = prompt;
  if (detectedDurationText) {
    cleaned = cleaned.replace(new RegExp(`(?:duration\\s*:?\\s*)?${escapeRegExp(detectedDurationText)}`, 'gi'), '');
  }
  // Strip trailing commas/spaces
  cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();

  return {
    detectedDuration,
    detectedDurationText,
    detectedAspectRatio,
    detectedStyle,
    cleanedPrompt: cleaned,
    rawPrompt: prompt,
    hasConflictWithSelector: hasConflict,
    conflictingSelectorDuration: currentSelectorDuration,
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
