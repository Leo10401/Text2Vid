// This is your entry file! Refer to it when you render:
// npx remotion render <entry-file> HelloWorld out/video.mp4

import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);

// ✅ Load Google Font dynamically
const loadGoogleFont = () => {
  const link = document.createElement("link");
  link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

loadGoogleFont();
