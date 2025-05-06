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
const writeFileAsync = util.promisify(fs.writeFile);
const mkdirAsync = util.promisify(fs.mkdir);

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use("/videos", express.static(path.join(__dirname, "videos")));
app.use("/videos/audio", express.static(path.join(__dirname, "videos", "audio")));

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

async function generateCaptionsWithGeminiFlash(prompt, isPDF = false, videoLength = "medium") {
  const maxRetries = 3;
  let lastError;
  
  // Determine caption count based on video length
  let captionCount;
  switch(videoLength) {
    case "short":
      captionCount = "4-6";
      break;
    case "long":
      captionCount = "24-32";
      break;
    case "medium":
    default:
      captionCount = "12-16";
      break;
  }
  
  // Safety check for large inputs
  if (prompt.length > 500000) {
    console.log(`⚠️ Input too large (${prompt.length} chars). Extracting key content...`);
    // Take the first 50K chars and the last 50K chars
    prompt = prompt.substring(0, 50000) + "\n...\n" + prompt.substring(prompt.length - 50000);
    console.log(`✂️ Truncated prompt to ${prompt.length} chars`);
  }
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Modify the prompt based on whether it's a PDF or regular text
      let systemPrompt;
      
      if (isPDF) {
        systemPrompt = `
          You are creating educational captions for a video based on the content of a document.
          
          The document content is:
          ${prompt}
          
          Create ${captionCount} educational captions that summarize the MAIN SUBJECT MATTER and KEY POINTS from this document.
          DO NOT focus on PDF structure (like catalog, pages, etc.) unless the document is actually about PDF structures.
          
          Your captions should:
          - Highlight the most important information from the document
          - Explain key concepts or findings from the actual content
          - Be educational and informative about the document's subject matter
          - Each caption should be 5-15 words - informative but concise
          - Together, they should give a good overview of what the document is about
          
          Format each caption on a new line.
        `;
      } else {
        systemPrompt = `
          Create ${captionCount} short, clear educational captions based on this topic: ${prompt}
          
          Requirements:
          - Each caption should be a single line
          - Keep captions between 3-8 words
          - No hashtags or emojis
          - Focus on key concepts and definitions
          - Make it educational but engaging
          
          Format each caption on a new line.
        `;
      }

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
      
      // Handle token limit errors
      if (error.message && error.message.includes("token count") && error.message.includes("exceeds")) {
        console.log("⚠️ Token limit exceeded. Truncating prompt further...");
        // Aggressively reduce the prompt size
        if (prompt.length > 10000) {
          prompt = prompt.substring(0, 10000);
          console.log(`✂️ Aggressively truncated prompt to ${prompt.length} chars`);
          continue;
        }
      }
      
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
async function fetchImagesFromPexels(queries, orientation = "portrait") {
  try {
    // Map orientation to Pexels orientation parameter
    let pexelsOrientation;
    switch (orientation) {
      case "landscape":
        pexelsOrientation = "landscape";
        break;
      case "square":
        pexelsOrientation = "square";
        break;
      case "portrait":
      default:
        pexelsOrientation = "portrait";
        break;
    }
    
    const imagePromises = queries.map(async (query) => {
      const response = await axios.get("https://api.pexels.com/v1/search", {
        headers: { Authorization: process.env.PEXELS_API_KEY },
        params: { 
          query, 
          per_page: 1, // We only need 1 image per caption
          orientation: pexelsOrientation 
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

// Function to generate speech audio for captions
async function generateSpeechAudio(captions) {
  try {
    console.log("ℹ️ Using simplified TTS approach - skipping audio generation");
    // In this simplified approach, we'll use browser TTS during playback
    // Return placeholder values
    return captions.map((_, i) => `/videos/audio/placeholder_${i}.mp3`);
  } catch (error) {
    console.error("❌ Error generating speech audio:", error);
    return [];
  }
}

// Function to summarize document content
async function summarizeDocument(content, isFromPDF = false) {
  // Safety check for large inputs
  if (content.length > 500000) {
    console.log(`⚠️ Input too large (${content.length} chars). Extracting key content...`);
    // Take the first 100K chars and the last 100K chars for better coverage
    content = content.substring(0, 100000) + "\n...\n" + content.substring(content.length - 100000);
    console.log(`✂️ Truncated content to ${content.length} chars for summarization`);
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let systemPrompt;
    if (isFromPDF) {
      systemPrompt = `
        You are analyzing the text content extracted from a PDF document.
        This may include both the main text content and structural elements of the PDF.
        
        Your task is to:
        1. Identify and focus ONLY on the actual informational content
        2. Ignore PDF structure elements like "obj", "endobj", "/Type", "/Pages", etc.
        3. Summarize the MAIN SUBJECT MATTER and KEY INFORMATION from the document
        4. Create a concise but comprehensive summary of what the document is about
        5. Focus on factual information, key concepts, and important details from the document
        
        Keep your summary to around 500 words and ensure it reflects what the document is actually about.
        
        PDF Content: ${content}
      `;
    } else {
      systemPrompt = `
        Summarize the key concepts from this document.
        Focus on extracting the most important information and main points.
        Keep your summary to around 300-500 words.
        Be informative yet concise.
        Content: ${content}
      `;
    }

    const result = await model.generateContent(systemPrompt);
    const summary = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!summary) throw new Error("Failed to generate summary");
    
    console.log("✅ Generated Document Summary");
    return summary;
  } catch (error) {
    console.error("❌ Error generating summary:", error);
    // If summarization fails, return a truncated version of the original content
    return content.length > 10000 ? content.substring(0, 10000) : content;
  }
}

// Function to generate video
async function generateVideo(promptText, isPDF = false, template = "modern", orientation = "portrait", videoLength = "medium") {
  try {
    // Generate captions with selected length
    const generatedCaptionText = await generateCaptionsWithGeminiFlash(promptText, isPDF, videoLength);
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
    const imageUrls = await fetchImagesFromPexels(searchQueries, orientation);
    console.log("📸 Fetched Images:", imageUrls);

    // For browser TTS instead of server-side TTS
    const textForSpeech = lines;
    console.log("🔊 Captions for speech:", textForSpeech);

    // Compute dynamic duration based on video length
    let framesPerCaption;
    let totalDurationInSeconds;
    switch(videoLength) {
      case "short":
        framesPerCaption = 75; // 2.5 seconds per caption at 30fps
        totalDurationInSeconds = 30; // 30 seconds for short videos
        break;
      case "long":
        framesPerCaption = 120; // 4 seconds per caption at 30fps
        totalDurationInSeconds = 120; // 2 minutes for long videos
        break;
      case "medium":
      default:
        framesPerCaption = 90; // 3 seconds per caption at 30fps
        totalDurationInSeconds = 60; // 1 minute for medium videos
        break;
    }
    
    // Calculate total frames (30fps)
    const totalDurationInFrames = totalDurationInSeconds * 30;
    
    // Ensure we have enough captions to fill the video duration
    // If not enough captions, we'll repeat them to fill the time
    const durationInFrames = Math.max(totalDurationInFrames, lines.length * framesPerCaption);

    // Create videos directory if it doesn't exist
    const videosDir = path.join(__dirname, "videos");
    if (!fs.existsSync(videosDir)) {
      await mkdirAsync(videosDir, { recursive: true });
    }

    // Delete previous output file if it exists to avoid potential conflicts
    const outputVideoPath = path.join(videosDir, "output.mp4");
    if (fs.existsSync(outputVideoPath)) {
      try {
        fs.unlinkSync(outputVideoPath);
        console.log("🗑️ Removed previous output video");
      } catch (err) {
        console.warn("⚠️ Warning: Could not remove previous output video:", err.message);
      }
    }

    // Save props data with text for browser-based TTS
    const propsFilePath = path.join(videosDir, "props.json");
    fs.writeFileSync(
      propsFilePath,
      JSON.stringify(
        {
          promptText: generatedCaptionText,
          durationInFrames,
          images: imageUrls,
          textForSpeech: textForSpeech,
          sourceType: isPDF ? "PDF" : "text",
          templateName: template,
          orientation: orientation,
          videoLength: videoLength,
          framesPerCaption: framesPerCaption
        },
        null,
        2
      )
    );

    // Determine which composition ID to use based on orientation
    let compositionId;
    if (orientation === "landscape") {
      compositionId = "CaptionedVideo-landscape";
    } else if (orientation === "square") {
      compositionId = "CaptionedVideo-square";
    } else {
      compositionId = "CaptionedVideo"; // Default for portrait
    }
    
    // Execute Remotion render with the appropriate composition
    const remotionProjectPath = path.join(__dirname, "TIKTOK");
    console.log(`🎬 Rendering video with orientation: ${orientation} (using composition: ${compositionId})...`);
    
    // Build the command
    const command = `cd ${remotionProjectPath} && npx remotion render src/index.ts ${compositionId} "../videos/output.mp4" --props="../videos/props.json"`;
    await execAsync(command);
    console.log("✅ Video rendering complete!");

    return "/videos/output.mp4";
  } catch (error) {
    console.error("❌ Error generating video:", error);
    throw error;
  }
}

// API to render video from prompt
app.post("/render-video", async (req, res) => {
  try {
    const { 
      userPrompt, 
      template = "modern", 
      orientation = "portrait",
      videoLength = "medium"
    } = req.body;
    
    if (!userPrompt) return res.status(400).json({ error: "No userPrompt provided." });

    const outputPath = await generateVideo(userPrompt, false, template, orientation, videoLength);
    return res.json({ message: "🎉 Video rendered successfully!", outputPath });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// API to render video from document upload
app.post("/render-video-document", upload.single("document"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No document uploaded." });

  try {
    // Read the uploaded document
    const documentText = fs.readFileSync(req.file.path, "utf-8");
    
    // Check if it's a PDF by filename
    const isPDF = req.file.originalname.toLowerCase().endsWith('.pdf');
    
    // Get template from form data
    const template = req.body.template || "modern";
    
    // Get orientation from form data
    const orientation = req.body.orientation || "portrait";
    
    // Get video length from form data
    const videoLength = req.body.videoLength || "medium";
    
    // Check if document is too large (rough estimate: 4 chars per token)
    const estimatedTokens = documentText.length / 4;
    const MAX_TOKENS = 800000; // Safe limit below Gemini's max of 1M tokens
    
    let processedText = documentText;
    let note = "";
    
    if (estimatedTokens > MAX_TOKENS) {
      console.log(`⚠️ Document too large (est. ${Math.round(estimatedTokens)} tokens). Summarizing...`);
      
      // Generate a summary of the document
      processedText = await summarizeDocument(documentText, isPDF);
      note = "Document was too large - a summary was processed";
    }
    
    const outputPath = await generateVideo(processedText, isPDF, template, orientation, videoLength);
    return res.json({ 
      message: "🎉 Video rendered successfully!",
      outputPath,
      note 
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to process document.", details: err.message });
  }
});

// Serve static files with proper headers for video playback
app.use("/videos", (req, res, next) => {
  // Set headers to prevent range request issues
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  express.static(path.join(__dirname, "videos"))(req, res, next);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
