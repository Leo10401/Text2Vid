"use client";
import { useState, useRef, useEffect } from "react";

// Template options
const TEMPLATES = [
  { id: "modern", name: "Modern", description: "Clean, modern look with animations" },
  { id: "minimal", name: "Minimal", description: "Simple, elegant design" },
  { id: "vibrant", name: "Vibrant", description: "Colorful and energetic style" }
];

// Orientation options
const ORIENTATIONS = [
  { id: "portrait", name: "Portrait", description: "Vertical 9:16", icon: "↕️" },
  { id: "landscape", name: "Landscape", description: "Horizontal 16:9", icon: "↔️" },
  { id: "square", name: "Square", description: "1:1 Ratio", icon: "⬛" }
];

// Video length options
const VIDEO_LENGTHS = [
  { id: "short", name: "Short", description: "30 seconds (4-6 captions)", icon: "⏱️" },
  { id: "medium", name: "Medium", description: "1 minute (12-16 captions)", icon: "⏲️" },
  { id: "long", name: "Long", description: "2 minutes (24-32 captions)", icon: "🕰️" }
];

export default function TikTokVideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [videoPath, setVideoPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [captions, setCaptions] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [selectedOrientation, setSelectedOrientation] = useState("portrait");
  const [selectedLength, setSelectedLength] = useState("medium");
  const [videoKey, setVideoKey] = useState(Date.now()); // Key for forced video refresh
  const videoRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  
  // For text-to-speech of captions
  useEffect(() => {
    // Check if browser supports Speech Synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
    
    // Cleanup function to cancel any ongoing speech on unmount
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // Function to handle video errors
  const handleVideoError = (e) => {
    console.error("Video playback error:", e);
    // Force a reload of the video element
    if (videoRef.current) {
      setVideoKey(Date.now()); // Change key to force React to recreate the element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 500);
    }
  };
  
  // Function to speak captions when video is playing
  const handleVideoPlay = () => {
    if (captions.length > 0 && speechSynthesisRef.current) {
      // Cancel any ongoing speech
      speechSynthesisRef.current.cancel();
      
      // Create utterance for all captions
      const utterance = new SpeechSynthesisUtterance(captions.join(". "));
      utterance.rate = 1;
      utterance.pitch = 1;
      
      // Start speaking
      speechSynthesisRef.current.speak(utterance);
    }
  };
  
  // Handle video pause - stop speech
  const handleVideoPause = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.pause();
    }
  };
  
  // Handle video end - stop speech
  const handleVideoEnded = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  };

  const handleClear = () => {
    setPrompt("");
    setDocumentFile(null);
    setVideoPath("");
    setError("");
    setNotification("");
    setCaptions([]);
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !documentFile) {
      setError("Please enter a prompt or upload a document!");
      return;
    }

    setLoading(true);
    setError("");
    setVideoPath("");
    setNotification("");
    setCaptions([]);

    try {
      let response;
      // If a document is provided, use the document endpoint
      if (documentFile) {
        const formData = new FormData();
        formData.append("document", documentFile);
        formData.append("template", selectedTemplate);
        formData.append("orientation", selectedOrientation);
        formData.append("videoLength", selectedLength);

        console.log("🚀 Sending document to backend...");
        response = await fetch("http://localhost:5000/render-video-document", {
          method: "POST",
          body: formData,
        });
      } else {
        console.log("🚀 Sending prompt to backend...");
        response = await fetch("http://localhost:5000/render-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userPrompt: prompt,
            template: selectedTemplate,
            orientation: selectedOrientation,
            videoLength: selectedLength
          }),
        });
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      // Force video element refresh with new source
      setVideoKey(Date.now());
      setVideoPath(data.outputPath + "?t=" + Date.now()); // Add timestamp to bust cache
      
      // Set notification if there's a note from the server
      if (data.note) {
        setNotification(data.note);
      }
      
      // Get captions for speech - fetch the props.json file
      try {
        const propsResponse = await fetch("http://localhost:5000/videos/props.json?t=" + Date.now());
        const propsData = await propsResponse.json();
        if (propsData.textForSpeech) {
          setCaptions(propsData.textForSpeech);
        } else if (propsData.promptText) {
          // Fallback to promptText if textForSpeech is not available
          setCaptions(propsData.promptText.split('\n').filter(line => line.trim() !== ""));
        }
      } catch (err) {
        console.error("Failed to load captions:", err);
      }
    } catch (err) {
      console.error("❌ Error generating video:", err);
      setError("Failed to generate video. Please check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Left Section */}
        <div>
          <h1 className="text-3xl font-bold text-black">Create TikTok Videos with Gemini AI</h1>
          <p className="text-gray-600 mt-2">Generate captivating TikTok videos based on your prompts or document uploads.</p>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here (optional if document is uploaded)"
            className="w-full mt-4 p-2 border rounded text-purple-400"
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setDocumentFile(e.target.files[0])}
            placeholder="Give your document"
            className="w-full mt-4 p-2 text-amber-400 to-black border rounded"
          />
          
          {/* Template Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Video Template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-2 border rounded text-sm transition-all ${
                    selectedTemplate === template.id 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{template.name}</div>
                  <div className="text-xs">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Orientation Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Video Orientation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ORIENTATIONS.map(orientation => (
                <button
                  key={orientation.id}
                  onClick={() => setSelectedOrientation(orientation.id)}
                  className={`p-2 border rounded text-sm transition-all ${
                    selectedOrientation === orientation.id 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xl mb-1">{orientation.icon}</div>
                  <div className="font-semibold">{orientation.name}</div>
                  <div className="text-xs">{orientation.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Video Length Selection */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Video Length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_LENGTHS.map(length => (
                <button
                  key={length.id}
                  onClick={() => setSelectedLength(length.id)}
                  className={`p-2 border rounded text-sm transition-all ${
                    selectedLength === length.id 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xl mb-1">{length.icon}</div>
                  <div className="font-semibold">{length.name}</div>
                  <div className="text-xs">{length.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {notification && <p className="text-blue-500 mt-2">⚠️ {notification}</p>}
          <div className="mt-4 flex gap-4">
            <button onClick={handleClear} className="px-4 py-2 text-black hover:bg-red-300 duration-150 border rounded">
              Clear
            </button>
            <button
              onClick={handleGenerate}
              className={`px-4 py-2 text-white rounded ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
              }`}
              disabled={loading}
            >
              {loading ? "⏳ Generating..." : "🎬 Create Video"}
            </button>
          </div>
        </div>

        {/* Right Section - Video Preview */}
        <div className="bg-gray-200 w-full h-80 flex items-center justify-center rounded">
          {videoPath ? (
            <video 
              key={videoKey}
              ref={videoRef}
              controls 
              width="100%" 
              className="rounded"
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
            >
              <source src={`http://localhost:5000${videoPath}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <span className="text-gray-500">{loading ? "Processing..." : "Video Preview"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
