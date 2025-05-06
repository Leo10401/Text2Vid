import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { TemplateBaseProps } from "../types";

export const MinimalTemplate: React.FC<TemplateBaseProps> = ({ 
  image, 
  caption,
  orientation = "portrait"
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Subtle animations
  const opacity = interpolate(
    frame,
    [0, 10, 80, 90],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );
  
  // Text animation - slides in from bottom
  const textY = interpolate(
    frame,
    [0, 15],
    [20, 0],
    { extrapolateRight: "clamp" }
  );
  
  // Adjust layout based on orientation
  const getImageContainerStyle = () => {
    if (orientation === "landscape") {
      return {
        position: "absolute" as const,
        width: "70%",
        height: "100%",
        overflow: "hidden" as const
      };
    } else if (orientation === "square") {
      return {
        position: "absolute" as const,
        width: "100%",
        height: "70%",
        overflow: "hidden" as const
      };
    }
    
    // Default portrait
    return {
      position: "absolute" as const,
      width: "100%",
      height: "80%",
      overflow: "hidden" as const
    };
  };
  
  const getTextContainerStyle = () => {
    if (orientation === "landscape") {
      return {
        position: "absolute" as const,
        right: 0,
        width: "30%",
        height: "100%",
        backgroundColor: "white",
        display: "flex" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        opacity
      };
    } else if (orientation === "square") {
      return {
        position: "absolute" as const,
        bottom: 0,
        width: "100%",
        height: "30%",
        backgroundColor: "white",
        display: "flex" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        opacity
      };
    }
    
    // Default portrait
    return {
      position: "absolute" as const,
      bottom: 0,
      width: "100%",
      height: "20%",
      backgroundColor: "white",
      display: "flex" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      opacity
    };
  };
  
  const getTextStyle = () => {
    const baseStyle = {
      fontWeight: "500" as const,
      color: "#333",
      textAlign: "center" as const,
      maxWidth: "90%",
      transform: `translateY(${textY}px)`,
      borderBottom: "2px solid #333",
      paddingBottom: "10px"
    };
    
    if (orientation === "landscape") {
      return { ...baseStyle, fontSize: 38 };
    } else if (orientation === "square") {
      return { ...baseStyle, fontSize: 48 };
    }
    
    return { ...baseStyle, fontSize: 54 };
  };
  
  return (
    <AbsoluteFill 
      style={{ 
        backgroundColor: "white", 
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        overflow: "hidden" 
      }}
    >
      {/* Image Container */}
      <div style={getImageContainerStyle()}>
        <Img 
          src={image} 
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover"
          }} 
        />
      </div>
      
      {/* Bottom or Side Container for Caption */}
      <div style={getTextContainerStyle()}>
        <div style={getTextStyle()}>
          {caption}
        </div>
      </div>
    </AbsoluteFill>
  );
}; 