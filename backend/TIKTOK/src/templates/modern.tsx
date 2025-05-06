import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { TemplateBaseProps } from "../types";

export const ModernTemplate: React.FC<TemplateBaseProps> = ({ 
  image, 
  caption,
  orientation = "portrait"
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Animations
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 15 }
  });
  
  const opacity = interpolate(
    frame,
    [0, 15, 75, 90],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );
  
  const scale = interpolate(
    entranceProgress,
    [0, 1],
    [0.8, 1]
  );
  
  const captionY = interpolate(
    entranceProgress,
    [0, 1],
    [50, 0]
  );
  
  // Adjust styling based on orientation
  const getCaptionStyles = () => {
    // Base styles
    const baseStyles = {
      fontSize: 60, 
      fontWeight: "bold", 
      color: "white", 
      textAlign: "center" as const, 
      textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
      maxWidth: "80%",
      padding: "20px",
      borderLeft: "5px solid #ff5555",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: "0 10px 10px 0"
    };

    // Adjust font size based on orientation
    if (orientation === "landscape") {
      return { ...baseStyles, fontSize: 48 };
    } else if (orientation === "square") {
      return { ...baseStyles, fontSize: 54 };
    }
    
    return baseStyles;
  };
  
  return (
    <AbsoluteFill 
      style={{ 
        backgroundColor: "#111111", 
        fontFamily: "Inter, sans-serif",
        overflow: "hidden" 
      }}
    >
      {/* Background Image with Zoom Effect */}
      <div style={{ 
        position: "absolute", 
        width: "100%", 
        height: "100%",
        overflow: "hidden"
      }}>
        <Img 
          src={image} 
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover",
            transform: `scale(${interpolate(frame, [0, 90], [1, 1.1])})`,
            filter: "brightness(0.7)"
          }} 
        />
        
        {/* Gradient Overlay */}
        <div style={{ 
          position: "absolute", 
          bottom: 0, 
          width: "100%", 
          height: "50%", 
          background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)" 
        }} />
      </div>
      
      {/* Caption with Animation */}
      <div style={{ 
        position: "absolute", 
        bottom: orientation === "landscape" ? "15%" : "20%", 
        width: "100%", 
        display: "flex", 
        justifyContent: "center", 
        opacity,
        transform: `translateY(${captionY}px) scale(${scale})`
      }}>
        <div style={getCaptionStyles()}>
          {caption}
        </div>
      </div>
    </AbsoluteFill>
  );
}; 