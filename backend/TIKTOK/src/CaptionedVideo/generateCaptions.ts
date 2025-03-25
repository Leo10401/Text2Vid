import { Caption } from "@remotion/captions";

// src/CaptionedVideo/generateCaptions.ts
export function generateCaptionsFromPrompt(promptText: string, totalDurationMs: number): Caption[] {
  const lines = promptText.split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const lineDuration = totalDurationMs / lines.length;

  return lines.map((line, index) => {
    const startMs = index * lineDuration;
    const endMs = (index + 1) * lineDuration;
    
    return {
      startMs,
      endMs,
      text: line,
      timestampMs: startMs,
      confidence: 1,
      tokens: [{
        text: line,
        fromMs: startMs,
        toMs: endMs,
      }],
    };
  });
}