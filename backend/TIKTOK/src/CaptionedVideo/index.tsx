import React, { useMemo } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { TemplateSelector, TemplateName } from "../templates";

// Define video dimensions for different orientations
export type VideoOrientation = "portrait" | "landscape" | "square";

type Props = {
  promptText: string;
  images: string[];
  durationInFrames: number;
  templateName?: TemplateName;
  orientation?: VideoOrientation;
  framesPerCaption?: number;
};

export const CaptionedVideo: React.FC<Props> = ({ 
  promptText, 
  images, 
  durationInFrames,
  templateName = "modern",
  orientation = "portrait",
  framesPerCaption = 90
}) => {
  // Extract captions from promptText
  const captions = useMemo(() => 
    promptText.split("\n")
      .filter((line) => line.trim() !== "")
      .map(line => line.trim()),
    [promptText]
  );

  // Estimate how many total captions we need for the entire duration
  const requiredCaptionCount = useMemo(() => 
    Math.ceil(durationInFrames / framesPerCaption),
    [durationInFrames, framesPerCaption]
  );

  // If we have fewer captions than required, repeat them to fill
  const extendedCaptions = useMemo(() => {
    if (captions.length >= requiredCaptionCount) {
      return captions;
    }
    
    // Create a repeated array of captions
    const repeatedCaptions = [];
    for (let i = 0; i < requiredCaptionCount; i++) {
      repeatedCaptions.push(captions[i % captions.length]);
    }
    return repeatedCaptions;
  }, [captions, requiredCaptionCount]);

  // Generate sequences to fill the entire video duration
  const sequences = useMemo(() => {
    const result = [];
    
    // Create a sequence for each caption (either original or extended)
    for (let i = 0; i < Math.min(requiredCaptionCount, extendedCaptions.length); i++) {
      const caption = extendedCaptions[i];
      const imageIndex = i % images.length;
      const imageUrl = images.length > 0 ? images[imageIndex] : "";
      
      // Calculate sequence duration (for the last caption, might be shorter)
      const sequenceDuration = Math.min(
        framesPerCaption, 
        durationInFrames - i * framesPerCaption
      );
      
      if (sequenceDuration <= 0) break;
      
      result.push(
        <Sequence 
          key={`caption-${i}`} 
          from={i * framesPerCaption} 
          durationInFrames={sequenceDuration}
        >
          <TemplateSelector 
            templateName={templateName}
            image={imageUrl} 
            caption={caption}
            orientation={orientation}
          />
        </Sequence>
      );
    }
    
    return result;
  }, [
    extendedCaptions, 
    images, 
    durationInFrames, 
    framesPerCaption, 
    templateName, 
    orientation,
    requiredCaptionCount
  ]);

  return (
    <AbsoluteFill>
      {sequences}
    </AbsoluteFill>
  );
};
