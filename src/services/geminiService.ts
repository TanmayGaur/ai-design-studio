import { GoogleGenerativeAI } from "@google/generative-ai";
import { DesignElement } from "../context/DesignContext";

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface GenerationRequest {
  prompt: string;
  images?: File[];
  pageSettings?: {
    width: number;
    height: number;
    unit: string;
  };
}

export interface GenerationResponse {
  elements: Omit<DesignElement, "id">[];
  pageSettings?: {
    backgroundColor?: string;
    title?: string;
  };
  metadata?: {
    description: string;
    tags: string[];
  };
}

// Rate limiting
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 10;
  private readonly timeWindow = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow
    );
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

// Convert image file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // Remove data:image/... prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Generate design elements using Gemini AI
export const generateDesignElements = async (
  request: GenerationRequest
): Promise<GenerationResponse> => {
  if (!genAI) {
    throw new Error(
      "Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables."
    );
  }

  if (!rateLimiter.canMakeRequest()) {
    throw new Error(
      "Rate limit exceeded. Please wait before making another request."
    );
  }

  try {
    rateLimiter.recordRequest();

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare the prompt
    const systemPrompt = `You are a professional design assistant that generates design elements for a page layout tool. 

IMPORTANT: You must respond with ONLY a valid JSON object, no additional text or formatting.

Based on the user's request, generate design elements with the following structure:

{
  "elements": [
    {
      "type": "text" | "image" | "shape" | "line",
      "x": number (in mm),
      "y": number (in mm), 
      "width": number (in mm),
      "height": number (in mm),
      "rotation": number (0-360 degrees),
      "content": "string (for text elements)",
      "zIndex": number,
      "styles": {
        "fontSize": "16px",
        "fontFamily": "Arial, sans-serif",
        "color": "#000000",
        "backgroundColor": "#ffffff",
        "textAlign": "left",
        "borderRadius": "0px",
        "opacity": 1
      }
    }
  ],
  "pageSettings": {
    "backgroundColor": "#ffffff",
    "width": number (in mm),
    "height": number (in mm),
    "orientation": 'portrait' | 'landscape',
    "margins": {
      "top": number,
      "right": number,
      "bottom": number,
      "left": number,
    };
  },
  "metadata": {
    "description": "Brief description of the generated design",
    "tags": ["tag1", "tag2"]
  }
}

Guidelines:
- Use millimeters (mm) for all positioning and sizing
- Standard A4 page is 210mm x 297mm
- Position elements logically with proper spacing
- Choose appropriate colors and fonts
- Create visually appealing layouts
- For text elements, provide meaningful content
- For shapes, use appropriate colors and sizes
- Ensure elements don't overlap unless intentional

User's page dimensions: ${request.pageSettings?.width || 210}mm x ${
      request.pageSettings?.height || 297
    }mm`;

    let parts: any[] = [
      { text: systemPrompt },
      { text: `User request: ${request.prompt}` },
    ];

    // Add images if provided
    if (request.images && request.images.length > 0) {
      for (const image of request.images) {
        try {
          const base64Data = await fileToBase64(image);
          parts.push({
            inlineData: {
              mimeType: image.type,
              data: base64Data,
            },
          });
          parts.push({
            text: "Please analyze this reference image and incorporate its style, layout, or content into the design.",
          });
        } catch (error) {
          console.warn("Failed to process image:", error);
        }
      }
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedResponse: GenerationResponse;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      throw new Error("Invalid response format from AI service");
    }

    // Validate and sanitize the response
    if (!parsedResponse.elements || !Array.isArray(parsedResponse.elements)) {
      throw new Error("Invalid elements array in AI response");
    }

    // Sanitize elements
    parsedResponse.elements = parsedResponse.elements.map((element) => ({
      type: ["text", "image", "shape", "line"].includes(element.type)
        ? element.type
        : "text",
      x: Math.max(0, Number(element.x) || 10),
      y: Math.max(0, Number(element.y) || 10),
      width: Math.max(10, Number(element.width) || 100),
      height: Math.max(10, Number(element.height) || 50),
      rotation: Math.max(0, Math.min(360, Number(element.rotation) || 0)),
      content:
        element.content || (element.type === "text" ? "Sample Text" : ""),
      zIndex: Math.max(0, Number(element.zIndex) || 0),
      styles: {
        fontSize: element.styles?.fontSize || "16px",
        fontFamily: element.styles?.fontFamily || "Arial, sans-serif",
        color: element.styles?.color || "#000000",
        backgroundColor:
          element.styles?.backgroundColor ||
          (element.type === "text" ? "transparent" : "#f3f4f6"),
        textAlign: element.styles?.textAlign || "left",
        borderRadius: element.styles?.borderRadius || "0px",
        opacity: Math.max(0, Math.min(1, Number(element.styles?.opacity) || 1)),
        ...element.styles,
      },
    }));

    console.log("parsedResponse", parsedResponse);

    return parsedResponse;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate design elements");
  }
};

// Validate API key
export const validateApiKey = (): boolean => {
  return !!API_KEY;
};

// Get API status
export const getApiStatus = (): {
  configured: boolean;
  rateLimited: boolean;
} => {
  return {
    configured: validateApiKey(),
    rateLimited: !rateLimiter.canMakeRequest(),
  };
};
