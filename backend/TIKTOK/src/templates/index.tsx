import React from "react";
import { ModernTemplate } from "./modern";
import { MinimalTemplate } from "./minimal";
import { VibrantTemplate } from "./vibrant";
import { VideoOrientation } from "../CaptionedVideo";

export const TEMPLATES = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  vibrant: VibrantTemplate,
  // Add more templates as they are created
};

export type TemplateName = keyof typeof TEMPLATES;

interface TemplateProps {
  templateName: TemplateName;
  image: string;
  caption: string;
  orientation?: VideoOrientation;
}

export const TemplateSelector: React.FC<TemplateProps> = ({ 
  templateName = 'modern', 
  image, 
  caption,
  orientation = 'portrait'
}) => {
  const Template = TEMPLATES[templateName] || TEMPLATES.modern;
  return <Template image={image} caption={caption} orientation={orientation} />;
}; 