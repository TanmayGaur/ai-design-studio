import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";
import { useDesign } from "../context/DesignContext";
import {
  generateDesignElements,
  getApiStatus,
  GenerationRequest,
} from "../services/geminiService";

const AIGenerationPanel: React.FC = () => {
  const { addElements, updatePageSettings, state } = useDesign();
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiStatus = getApiStatus();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length !== files.length) {
      setError("Some files were not valid images and were skipped.");
    }

    setImages((prev) => [...prev, ...validImages].slice(0, 3)); // Limit to 3 images

    if (event.target) {
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a description of what you want to create.");
      return;
    }

    if (!apiStatus.configured) {
      setError(
        "Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables."
      );
      return;
    }

    if (apiStatus.rateLimited) {
      setError(
        "Rate limit exceeded. Please wait before making another request."
      );
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const currentPage = state.pages.find((p) => p.id === state.currentPageId);

      const request: GenerationRequest = {
        prompt: prompt.trim(),
        images: images.length > 0 ? images : undefined,
        pageSettings: currentPage
          ? {
              width: currentPage.settings.width,
              height: currentPage.settings.height,
              unit: currentPage.settings.unit,
            }
          : undefined,
      };

      const response = await generateDesignElements(request);

      //   response.elements.forEach(element => {
      //     addElement(element);
      //     console.log("added element",element)
      //   });

      // Update page settings if provided
      if (response.pageSettings) {
        updatePageSettings(state.currentPageId, response.pageSettings);
      }

      // Add generated elements to the canvas
      addElements(response.elements);

      setSuccess(
        `Successfully generated ${response.elements.length} design elements!`
      );
      setPrompt("");
      setImages([]);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate design elements";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "Create a modern business card layout with company logo placeholder and contact information",
    "Design a minimalist poster for a coffee shop with warm colors and elegant typography",
    "Generate a professional resume template with sections for experience and skills",
    "Create a wedding invitation with romantic elements and elegant fonts",
    "Design a tech startup landing page with hero section and feature highlights",
  ];

  return (
    <div className="space-y-6">
      {/* API Status */}
      <div
        className={`p-3 rounded-lg border ${
          apiStatus.configured
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        }`}
      >
        <div className="flex items-center space-x-2">
          {apiStatus.configured ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span
            className={`text-sm ${
              apiStatus.configured
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {apiStatus.configured ? "Ready" : "API Key Required"}
          </span>
        </div>
        {!apiStatus.configured && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Add VITE_GEMINI_API_KEY to your environment variables
          </p>
        )}
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Describe what you want to create
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a modern business card with blue colors and professional typography..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={4}
          disabled={isGenerating}
        />
      </div>

      {/* Example Prompts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Example prompts
        </label>
        <div className="space-y-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              className="w-full text-left p-2 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 transition-colors"
              disabled={isGenerating}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reference Images (Optional)
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer transition-colors"
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click to upload reference images
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            PNG, JPG, WebP (max 3 images)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={isGenerating}
        />

        {/* Uploaded Images */}
        {images.length > 0 && (
          <div className="mt-3 space-y-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {image.name}
                  </span>
                </div>
                <button
                  onClick={() => removeImage(index)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  disabled={isGenerating}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {error}
            </span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {success}
            </span>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating || !apiStatus.configured}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Wand2 className="h-5 w-5" />
            <span>Generate Design</span>
          </>
        )}
      </button>

      {/* Usage Tips */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Tips for better results:
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Be specific about colors, fonts, and layout preferences</li>
          <li>• Mention the purpose (business card, poster, etc.)</li>
          <li>• Include style keywords (modern, vintage, minimalist)</li>
          <li>• Upload reference images for style inspiration</li>
          <li>• Specify dimensions or content requirements</li>
        </ul>
      </div>
    </div>
  );
};

export default AIGenerationPanel;
