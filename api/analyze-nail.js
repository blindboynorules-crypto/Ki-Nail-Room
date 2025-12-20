
import { GoogleGenAI } from "@google/genai";

// api/analyze-nail.js
// VERSION: V82_GEMINI_3_THINKING_UPGRADE
// SECURE PROXY: Server-side Gemini API call with Thinking capabilities

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
    
    // Upgrade to Gemini 3 Flash Preview
    let model = "gemini-3-flash-preview";
    let contents = { parts: [] };
    let config = {};

    if (type === 'chat') {
        // --- CHAT MODE (With Grounding) ---
        contents.parts.push({ text: prompt });
        config = {
            tools: [{ googleSearch: {} }], 
            temperature: 0.7,
        };
    } else {
        // --- PRICING/VISION MODE (Strict JSON + Thinking) ---
        if (imageBase64) {
             contents.parts.push({ inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } });
        }
        contents.parts.push({ text: prompt });
        config = {
            responseMimeType: "application/json",
            temperature: 0,
            topP: 0.1,
            topK: 1,
            seed: 1,
            // Kích hoạt Thinking Budget để AI tính toán logic hơn (đếm ngón, cộng tiền)
            thinkingConfig: { thinkingBudget: 2000 } 
        };
    }

    console.log(`Calling Gemini [${model} - ${type || 'pricing'} mode with Thinking]...`);

    const result = await aiClient.models.generateContent({
      model,
      contents,
      config
    });

    const text = result.text || "";
    const groundingMetadata = result.candidates?.[0]?.groundingMetadata;

    return res.status(200).json({ text, groundingMetadata });

  } catch (error) {
    console.error("AI Proxy Error:", error);
    let msg = error.message || "Unknown AI Error";
    return res.status(500).json({ message: msg });
  }
}
