import React from "react";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, random } from "remotion";
import { TemplateBaseProps } from "../types";

export const VibrantTemplate: React.FC<TemplateBaseProps> = ({ 
  image, 
  caption,
  orientation = "portrait"
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Dynamic animations
  const opacity = interpolate(
    frame,
    [0, 10, 80, 90],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );
  
  // Background moving elements
  const generateElements = () => {
    const elements = [];
    const colors = ['#FF5D8F', '#00C2BA', '#FFC63F', '#8A2BE2', '#FF6B6B'];
    
    for (let i = 0; i < 20; i++) {
      const size = random(`size-${i}`) * 60 + 20;
      const x = random(`x-${i}`) * width;
      const y = random(`y-${i}`) * height;
      const rotation = interpolate(
        frame,
        [0, 90],
        [0, 360 * (random(`rotation-${i}`) < 0.5 ? -1 : 1)]
      );
      const colorIndex = Math.floor(random(`color-${i}`) * colors.length);
      
      elements.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors[colorIndex],
            opacity: 0.3,
            left: x,
            top: y,
            transform: `rotate(${rotation}deg)`,
          }}
        />
      );
    }
    
    return elements;
  };
  
  // Adjust image and text styling based on orientation
  const getImageStyle = () => {
    if (orientation === "landscape") {
      return { 
        width: "40%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        overflow: "hidden",
        border: "10px solid white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        marginRight: "40px",
        transform: `scale(${interpolate(frame, [0, 20], [0.5, 1], {extrapolateRight: "clamp"})})`,
        opacity: interpolate(frame, [0, 20], [0, 1], {extrapolateRight: "clamp"})
      };
    } else if (orientation === "square") {
      return { 
        width: "50%",
        aspectRatio: "1/1",
        borderRadius: "50%",
        overflow: "hidden",
        border: "10px solid white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        marginBottom: "30px",
        transform: `scale(${interpolate(frame, [0, 20], [0.5, 1], {extrapolateRight: "clamp"})})`,
        opacity: interpolate(frame, [0, 20], [0, 1], {extrapolateRight: "clamp"})
      };
    }
    
    // Default portrait
    return { 
      width: "60%",
      aspectRatio: "1/1",
      borderRadius: "50%",
      overflow: "hidden",
      border: "10px solid white",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      marginBottom: "40px",
      transform: `scale(${interpolate(frame, [0, 20], [0.5, 1], {extrapolateRight: "clamp"})})`,
      opacity: interpolate(frame, [0, 20], [0, 1], {extrapolateRight: "clamp"})
    };
  };
  
  const getContainerStyle = () => {
    const baseStyle = { 
      position: "absolute",
      width: "100%", 
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px"
    };
    
    if (orientation === "landscape") {
      return {
        ...baseStyle,
        flexDirection: "row" // Side by side
      };
    }
    
    // Default for portrait and square is column
    return {
      ...baseStyle,
      flexDirection: "column"
    };
  };
  
  const getWordStyle = (delay) => {
    const wordOpacity = interpolate(
      frame,
      [5 + delay, 15 + delay],
      [0, 1],
      { extrapolateRight: "clamp" }
    );
    
    const wordScale = interpolate(
      frame,
      [5 + delay, 15 + delay],
      [0.5, 1],
      { extrapolateRight: "clamp" }
    );
    
    const baseStyle = {
      fontWeight: "900",
      color: "white",
      textShadow: "2px 2px 0px #FF5D8F",
      opacity: wordOpacity,
      transform: `scale(${wordScale})`,
      display: "inline-block",
      padding: "0 5px"
    };
    
    // Adjust font size based on orientation
    if (orientation === "landscape") {
      return { ...baseStyle, fontSize: 44 };
    } else if (orientation === "square") {
      return { ...baseStyle, fontSize: 52 };
    }
    
    // Default portrait
    return { ...baseStyle, fontSize: 64 };
  };
  
  // Separate words for animated text
  const words = caption.split(' ');
  
  return (
    <AbsoluteFill 
      style={{ 
        backgroundColor: "#6C00FF",
        fontFamily: "'Nunito', sans-serif",
        overflow: "hidden" 
      }}
    >
      {/* Animated background elements */}
      {generateElements()}
      
      {/* Main Content Container */}
      <div style={getContainerStyle()}>
        {/* Image with circular mask */}
        <div style={getImageStyle()}>
          <Img 
            src={image} 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover"
            }} 
          />
        </div>
        
        {/* Caption with word-by-word animation */}
        <div style={{ 
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          maxWidth: orientation === "landscape" ? "50%" : "90%"
        }}>
          {words.map((word, i) => {
            const delay = i * 3;
            return (
              <span 
                key={i}
                style={getWordStyle(delay)}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}; 