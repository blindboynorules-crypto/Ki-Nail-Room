import { GoogleGenAI } from "@google/genai";

// api/analyze-nail.js
// SECURE PROXY: Chỉ chạy trên Server của Vercel
// Giấu kín API Key không cho Client nhìn thấy

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
    return res.status(500).json({ message: "Server configuration error: Missing API Key" });
  }

  try {
    const { imageBase64, mimeType, prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ message: "Missing image data" });
    }

    const aiClient = new GoogleGenAI({ apiKey });
    
    // Call Google Gemini from Server Side
    const result = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
            { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        temperature: 0, 
      }
    });

    return res.status(200).json({ text: result.text });

  } catch (error) {
    console.error("AI Proxy Error:", error);
    let msg = error.message || "Unknown AI Error";
    // Sanitize error message to not leak internal details if necessary
    return res.status(500).json({ message: msg });
  }
}