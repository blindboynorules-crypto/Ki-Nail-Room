import { GoogleGenAI } from "@google/genai";

// api/analyze-nail.js
// VERSION: V80_GROUNDING_SUPPORT
// SECURE PROXY: Server-side Gemini API call

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key missing on server");
    return res.status(500).json({ message: "Server configuration error: Missing API Key" });
  }

  try {
    const { imageBase64, mimeType, prompt, type } = req.body;

    // Validation
    if (!imageBase64 && !prompt && type !== 'chat') {
      return res.status(400).json({ message: "Missing data" });
    }

    const aiClient = new GoogleGenAI({ apiKey });
    
    // Dynamic Configuration based on Type
    let model = "gemini-2.5-flash";
    let contents = { parts: [] };
    let config = {};

    if (type === 'chat') {
        // --- CHAT MODE (With Grounding) ---
        // Uses Google Search to find latest info (trends, etc.)
        contents.parts.push({ text: prompt });
        config = {
            tools: [{ googleSearch: {} }], 
            temperature: 0.7, // Higher temperature for conversational style
        };
    } else {
        // --- PRICING/VISION MODE (Strict JSON) ---
        // Forces structured JSON output for the pricing UI
        if (imageBase64) {
             contents.parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } });
        }
        contents.parts.push({ text: prompt });
        config = {
            responseMimeType: "application/json",
            temperature: 0,
            topP: 0.1,
            topK: 1,
            seed: 1
        };
    }

    console.log(`Calling Gemini [${type || 'pricing'} mode]...`);

    const result = await aiClient.models.generateContent({
      model,
      contents,
      config
    });

    // Extract Text Response
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract Grounding Metadata (For Chat Mode)
    // Contains URLs and titles of sources used by Google Search
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

    return res.status(200).json({ text, groundingMetadata });

  } catch (error) {
    console.error("AI Proxy Error:", error);
    let msg = error.message || "Unknown AI Error";
    return res.status(500).json({ message: msg });
  }
}