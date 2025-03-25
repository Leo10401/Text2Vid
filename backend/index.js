require("dotenv").config();
const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const util = require("util");
const multer = require("multer");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const execAsync = util.promisify(exec);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use("/videos", express.static(path.join(__dirname, "videos")));

// Ensure API keys are set
if (!process.env.GEMINI_API_KEY || !process.env.PEXELS_API_KEY) {
  console.error("❌ Error: Missing API keys for Gemini or Pexels.");
  process.exit(1);
}

const upload = multer({ dest: "uploads/" });

// Function to generate captions using Gemini
async function generateCaptionsWithGeminiFlash(prompt) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      "Generate engaging TikTok-style captions. Provide at least 6 short, creative lines.\n\nPrompt: " + prompt
    );

    console.log("✅ Gemini Response:", JSON.stringify(result, null, 2));
    const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Invalid Gemini API response format.");

    return text;
  } catch (error) {
    console.error("❌ Error generating captions:", error);
    throw new Error("Failed to generate captions.");
  }
}

// Function to fetch images from Pexels
async function fetchImagesFromPexels(query, numImages = 6) {
  try {
    const response = await axios.get("https://api.pexels.com/v1/search", {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      params: { query, per_page: numImages, orientation: "portrait" },
    });

    if (!response.data.photos || response.data.photos.length === 0) {
      throw new Error("No images found from Pexels.");
    }

    return response.data.photos.map((photo) => photo.src.large);
  } catch (error) {
    console.error("❌ Error fetching images from Pexels:", error);
    return []; // Return empty array if fetch fails
  }
}

// Function to generate video
async function generateVideo(promptText) {
  try {
    // Generate captions
    const generatedCaptionText = await generateCaptionsWithGeminiFlash(promptText);
    console.log("✅ Generated Captions:", generatedCaptionText);

    // Fetch images using the first caption line as query
    const firstCaptionLine = generatedCaptionText.split("\n")[0] || "nature";
    const imageUrls = await fetchImagesFromPexels(firstCaptionLine);
    console.log("📸 Fetched Images:", imageUrls);

    // Compute dynamic duration
    const lines = generatedCaptionText.split("\n").filter((line) => line.trim() !== "");
    const durationInFrames = lines.length * 90;

    // Save props data (captions + images)
    const propsFilePath = path.join(__dirname, "videos", "props.json");
    fs.writeFileSync(
      propsFilePath,
      JSON.stringify(
        {
          promptText: generatedCaptionText,
          durationInFrames,
          images: imageUrls,
        },
        null,
        2
      )
    );

    // Execute Remotion render
    const remotionProjectPath = path.join(__dirname, "TIKTOK");
    const command = `cd ${remotionProjectPath} && npx remotion render src/index.ts CaptionedVideo "../videos/output.mp4" --props="../videos/props.json"`;

    await execAsync(command);
    console.log("🎬 Video rendering complete!");

    return "/videos/output.mp4";
  } catch (err) {
    console.error("❌ Error generating video:", err);
    throw new Error("Failed to generate video.");
  }
}

// API to render video from prompt
app.post("/render-video", async (req, res) => {
  try {
    const { userPrompt } = req.body;
    if (!userPrompt) return res.status(400).json({ error: "No userPrompt provided." });

    const outputPath = await generateVideo(userPrompt);
    return res.json({ message: "🎉 Video rendered successfully!", outputPath });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// API to render video from document upload
app.post("/render-video-document", upload.single("document"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No document uploaded." });

  try {
    // Read the uploaded document (assuming it's a text file)
    const documentText = fs.readFileSync(req.file.path, "utf-8");

    const outputPath = await generateVideo(documentText);
    return res.json({ message: "🎉 Video rendered successfully!", outputPath });
  } catch (err) {
    return res.status(500).json({ error: "Failed to process document.", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
