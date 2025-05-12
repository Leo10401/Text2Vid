import React from "react";
import { Composition } from "remotion";
import { CaptionedVideo } from "./CaptionedVideo";
import { z } from "zod";
import { VIDEO_DIMENSIONS } from "./types";

// ✅ Define a schema to allow `durationInFrames`
const captionedVideoSchema = z.object({
  promptText: z.string(),
  images: z.array(z.string()),
  durationInFrames: z.number(),
  templateName: z.string().optional(),
  orientation: z.string().optional(),
  framesPerCaption: z.number().optional(),
});

// Optimize FPS for better performance
const FPS = 24; // Reduced from 30fps to 24fps for better performance

// Export as both Root and RemotionRoot to handle all potential imports
export const Root = () => {
  return (
    <>
      {/* Portrait (9:16) Composition - Default for TikTok/Reels */}
      <Composition
        id="CaptionedVideo"
        component={CaptionedVideo}
        width={VIDEO_DIMENSIONS.portrait.width}
        height={VIDEO_DIMENSIONS.portrait.height}
        fps={FPS}
        durationInFrames={3000} // Large enough to cover all user options
        schema={captionedVideoSchema}
        defaultProps={{
          promptText: "Example TikTok video\nWith multiple lines\nAnd animations",
          images: [],
          durationInFrames: 1080,
          templateName: "modern",
          orientation: "portrait",
          framesPerCaption: 60
        }}
      />
      
      {/* Landscape (16:9) Composition - For YouTube/Horizontal videos */}
      <Composition
        id="CaptionedVideo-landscape"
        component={CaptionedVideo}
        width={VIDEO_DIMENSIONS.landscape.width}
        height={VIDEO_DIMENSIONS.landscape.height}
        fps={FPS}
        durationInFrames={3000}
        schema={captionedVideoSchema}
        defaultProps={{
          promptText: "Example YouTube video\nWith multiple lines\nAnd animations",
          images: [],
          durationInFrames: 1080,
          templateName: "modern",
          orientation: "landscape",
          framesPerCaption: 60
        }}
      />
      
      {/* Square (1:1) Composition - For Instagram */}
      <Composition
        id="CaptionedVideo-square"
        component={CaptionedVideo}
        width={VIDEO_DIMENSIONS.square.width}
        height={VIDEO_DIMENSIONS.square.height}
        fps={FPS}
        durationInFrames={3000}
        schema={captionedVideoSchema}
        defaultProps={{
          promptText: "Example Instagram video\nWith multiple lines\nAnd animations",
          images: [],
          durationInFrames: 1080,
          templateName: "modern",
          orientation: "square",
          framesPerCaption: 60
        }}
      />
    </>
  );
};

// Also export as RemotionRoot for backward compatibility
export const RemotionRoot = Root;
