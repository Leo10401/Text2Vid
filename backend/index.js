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

// Add this helper function
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateCaptionsWithGeminiFlash(prompt) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Modify the prompt to request simpler captions
      const systemPrompt = `
        Create 6-8 short, clear educational captions based on this topic: ${prompt}
        
        Requirements:
        - Each caption should be a single line
        - Keep captions between 3-8 words
        - No hashtags or emojis
        - Focus on key concepts and definitions
        - Make it educational but engaging
        
        Format each caption on a new line.
      `;

      const result = await model.generateContent(systemPrompt);
      const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("Invalid Gemini API response format.");
      
      // Clean up the response to ensure one caption per line
      const cleanedText = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');

      return cleanedText;
    } catch (error) {
      lastError = error;
      
      if (error.status === 429) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`Rate limited. Waiting ${backoffMs/1000} seconds before retry...`);
        await wait(backoffMs);
        continue;
      }
      
      throw error;
    }
  }
  
  console.error("❌ Error generating captions after retries:", lastError);
  throw new Error("Failed to generate captions.");
}

// Modify the fetchImagesFromPexels function to handle multiple queries
async function fetchImagesFromPexels(queries) {
  try {
    const imagePromises = queries.map(async (query) => {
      const response = await axios.get("https://api.pexels.com/v1/search", {
        headers: { Authorization: process.env.PEXELS_API_KEY },
        params: { 
          query, 
          per_page: 1, // We only need 1 image per caption
          orientation: "portrait" 
        },
      });

      if (!response.data.photos || response.data.photos.length === 0) {
        return null;
      }

      return response.data.photos[0].src.large;
    });

    const images = await Promise.all(imagePromises);
    return images.filter(img => img !== null);
  } catch (error) {
    console.error("❌ Error fetching images from Pexels:", error);
    return [];
  }
}

// Function to generate video
async function generateVideo(promptText) {
  try {
    // Generate captions
    const generatedCaptionText = await generateCaptionsWithGeminiFlash(promptText);
    console.log("✅ Generated Captions:", generatedCaptionText);

    // Get all caption lines
    const lines = generatedCaptionText.split("\n").filter(line => line.trim() !== "");
    
    // Clean up the captions to make better search queries
    const searchQueries = lines.map(line => {
      // Remove hashtags, emojis, and special characters
      return line.replace(/#[^\s]+/g, '')  // Remove hashtags
                .replace(/[^\w\s]/g, '')   // Remove special chars
                .trim();
    });

    // Fetch one image per caption
    const imageUrls = await fetchImagesFromPexels(searchQueries);
    console.log("📸 Fetched Images:", imageUrls);

    // Compute dynamic duration
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
  } catch (error) {
    console.error("❌ Error generating video:", error);
    throw error;
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
