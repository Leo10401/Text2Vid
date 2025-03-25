import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";


const SubtitlePage: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 15, 75, 90], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", display: "flex", textAlign: "center" }}>
      <div
        style={{
          fontSize: 80,
          color: "white",
          fontWeight: "bold",
          WebkitTextStroke: "3px black",
          fontFamily: "'Montserrat', sans-serif", // ✅ Use Google Font
          letterSpacing: "1.5px",
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};


export default SubtitlePage;
