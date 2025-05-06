// Shared type definitions

// Video orientation options
export type VideoOrientation = "portrait" | "landscape" | "square";

// Video dimensions for different orientations
export const VIDEO_DIMENSIONS = {
  portrait: { width: 1080, height: 1920 }, // 9:16 for TikTok/Reels/Stories
  landscape: { width: 1920, height: 1080 }, // 16:9 for YouTube/Horizontal
  square: { width: 1080, height: 1080 }, // 1:1 for Instagram
};

// Base props for all templates
export interface TemplateBaseProps {
  image: string;
  caption: string;
  orientation: VideoOrientation;
} 