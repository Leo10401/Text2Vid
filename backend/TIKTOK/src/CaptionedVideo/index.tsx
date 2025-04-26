import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, Img } from "remotion";
import SubtitlePage from "./SubtitlePage";

type Props = {
  promptText: string;
  images: string[];
  durationInFrames: number; // ✅ Add this
};

export const CaptionedVideo: React.FC<Props> = ({ promptText, images, durationInFrames }) => {
  const captions = useMemo(() => 
    promptText.split("\n")
      .filter((line) => line.trim() !== "")
      .map(line => line.trim()),
    [promptText]
  );

  // Each caption shows for 3 seconds (90 frames at 30fps)
  const FRAMES_PER_CAPTION = 90;

  return (
    <AbsoluteFill>
      {captions.map((caption, index) => (
        <Sequence 
          key={index} 
          from={index * FRAMES_PER_CAPTION} 
          durationInFrames={FRAMES_PER_CAPTION}
        >
          {images[index % images.length] && (
            <Img 
              src={images[index % images.length]} 
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover"
              }} 
            />
          )}
          <SubtitlePage text={caption} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
