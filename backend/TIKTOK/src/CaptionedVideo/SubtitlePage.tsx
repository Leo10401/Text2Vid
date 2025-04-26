import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const SubtitlePage: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Smoother fade in/out animation
  const opacity = interpolate(
    frame,
    [0, 10, 80, 90],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill 
      style={{ 
        justifyContent: "flex-end", // Position text at bottom
        alignItems: "center",
        display: "flex",
        textAlign: "center",
        paddingBottom: "20%", // Add some bottom padding
      }}
    >
      <div
        style={{
          fontSize: 72,
          color: "white",
          fontWeight: "bold",
          WebkitTextStroke: "2px black",
          fontFamily: "'Montserrat', sans-serif",
          letterSpacing: "1px",
          opacity,
          maxWidth: "90%",
          textAlign: "center",
          padding: "20px",
          backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent background
          borderRadius: "10px",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export default SubtitlePage;
