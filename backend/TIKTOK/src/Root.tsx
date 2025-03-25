import React from "react";
import { Composition } from "remotion";
import { CaptionedVideo } from "./CaptionedVideo";
import { z } from "zod";

// ✅ Define a schema to allow `durationInFrames`
const captionedVideoSchema = z.object({
  promptText: z.string(),
  images: z.array(z.string()),
  durationInFrames: z.number(),
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CaptionedVideo"
      component={CaptionedVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={600} // Default (will be overridden dynamically)
      schema={captionedVideoSchema} // ✅ Use schema
      defaultProps={{
        promptText: "Default text for preview",
        images: [],
        durationInFrames: 300, // ✅ Now properly typed
      }}
    />
  );
};
