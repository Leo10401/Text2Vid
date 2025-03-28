"use client";
import { useState } from "react";

export default function TikTokVideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [videoPath, setVideoPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClear = () => {
    setPrompt("");
    setDocumentFile(null);
    setVideoPath("");
    setError("");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !documentFile) {
      setError("Please enter a prompt or upload a document!");
      return;
    }

    setLoading(true);
    setError("");
    setVideoPath("");

    try {
      let response;
      // If a document is provided, use the document endpoint
      if (documentFile) {
        const formData = new FormData();
        formData.append("document", documentFile);

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
          body: JSON.stringify({ userPrompt: prompt }),
        });
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      setVideoPath(data.outputPath);
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
            onChange={(e) => setDocumentFile(e.target.files[0])}
            placeholder="Give your document"
            className="w-full mt-4 p-2 text-amber-400 to-black border rounded"
          />
          {error && <p className="text-red-500 mt-2">{error}</p>}
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
        <div className="bg-gray-200 w-full h-64 flex items-center justify-center rounded">
          {videoPath ? (
            <video controls width="100%" className="rounded">
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
