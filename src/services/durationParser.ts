import { AspectRatio, VisualStyle, ParsePromptResult } from '../types/index.ts';

export function parsePromptClient(prompt: string, currentSelectorDuration?: number): ParsePromptResult {
  if (!prompt || typeof prompt !== 'string') {
    return {
      cleanedPrompt: '',
      rawPrompt: prompt || '',
      hasConflictWithSelector: false,
    };
  }

  let detectedDuration: number | undefined;
  let detectedDurationText: string | undefined;

  const minSecMatch = prompt.match(/\b(\d+)\s*(?:min(?:ute)?s?)\s*(?:and\s*)?(\d+)\s*(?:sec(?:ond)?s?)\b/i);
  if (minSecMatch) {
    const mins = parseInt(minSecMatch[1], 10);
    const secs = parseInt(minSecMatch[2], 10);
    detectedDuration = mins * 60 + secs;
    detectedDurationText = minSecMatch[0];
  } else {
    const decimalMinMatch = prompt.match(/\b(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?|m)\b/i);
    if (decimalMinMatch && !prompt.match(/\b\d+\s*m(?:eter|ile)s?\b/i)) {
      const mins = parseFloat(decimalMinMatch[1]);
      detectedDuration = Math.round(mins * 60);
      detectedDurationText = decimalMinMatch[0];
    } else {
      const secMatch = prompt.match(/\b(?:duration\s*:?\s*)?(\d+)\s*(?:seconds?|secs?|s)\b/i);
      if (secMatch) {
        detectedDuration = parseInt(secMatch[1], 10);
        detectedDurationText = secMatch[0];
      }
    }
  }

  let detectedAspectRatio: AspectRatio | undefined;
  if (/\b(?:vertical|portrait|9[:/]16)\b/i.test(prompt)) {
    detectedAspectRatio = '9:16';
  } else if (/\b(?:square|1[:/]1)\b/i.test(prompt)) {
    detectedAspectRatio = '1:1';
  } else if (/\b(?:horizontal|landscape|widescreen|16[:/]9)\b/i.test(prompt)) {
    detectedAspectRatio = '16:9';
  }

  let detectedStyle: VisualStyle | undefined;
  if (/\bcinematic\b/i.test(prompt)) detectedStyle = 'cinematic';
  else if (/\brealistic|photorealistic|hyperrealistic\b/i.test(prompt)) detectedStyle = 'realistic';
  else if (/\banimation|anime\b/i.test(prompt)) detectedStyle = 'animation';
  else if (/\bcartoon\b/i.test(prompt)) detectedStyle = 'cartoon';
  else if (/\bfantasy\b/i.test(prompt)) detectedStyle = 'fantasy';
  else if (/\bdocumentary\b/i.test(prompt)) detectedStyle = 'documentary';

  const hasConflict = 
    detectedDuration !== undefined &&
    currentSelectorDuration !== undefined &&
    Math.abs(detectedDuration - currentSelectorDuration) >= 1;

  let cleaned = prompt;
  if (detectedDurationText) {
    cleaned = cleaned.replace(new RegExp(`(?:duration\\s*:?\\s*)?${escapeRegExp(detectedDurationText)}`, 'gi'), '');
  }
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
