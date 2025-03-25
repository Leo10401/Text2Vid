// src/CaptionedVideo/Page.tsx
import React from "react";
import { AbsoluteFill } from "remotion";

const HIGHLIGHT_COLOR = "#39E508";

const container: React.CSSProperties = {
  justifyContent: "center",
  alignItems: "center",
  display: "flex",
  height: "100%",
  textAlign: "center",
};

const textStyle: React.CSSProperties = {
  fontSize: 80,
  color: "white",
  WebkitTextStroke: "2px black",
  fontFamily: "'Montserrat', sans-serif", // ✅ Use Google Font
  textTransform: "uppercase",
  textAlign: "center",
  letterSpacing: "2px",
};


export const Page: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill style={container}>
      <div style={textStyle}>{text}</div>
    </AbsoluteFill>
  );
};
