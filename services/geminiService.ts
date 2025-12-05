import { GoogleGenAI } from "@google/genai";
import { ChatMessage, PricingResult } from "../types";

// Initialize Gemini
// NOTE: Ensure process.env.API_KEY is defined in your build tool (Vite)
const apiKey = process.env.API_KEY || ''; 

// Debug log (will show in browser console)
if (!apiKey) {
  console.warn("⚠️ Gemini API Key is missing. Features relying on AI will fail.");
} else {
  console.log("✅ Gemini API Key detected.");
}

let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

export const isAiAvailable = (): boolean => !!aiClient;

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getAiConsultation = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  if (!aiClient) {
    return "Hệ thống chưa nhận được API Key. Vui lòng kiểm tra cấu hình Vercel (Settings > Environment Variables).";
  }

  try {
    const chat = aiClient.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `Bạn là một chuyên gia tư vấn Nail (làm móng) chuyên nghiệp, dễ thương và có gu thẩm mỹ cao tại 'Ki Nail Room'.
        Phong cách chủ đạo của tiệm là: Hàn Quốc và Nhật Bản (nhẹ nhàng, trong trẻo, tinh tế, cute).
        
        Nhiệm vụ của bạn là tư vấn cho khách hàng các mẫu nail, màu sắc, và kiểu dáng phù hợp với:
        1. Tông da của họ.
        2. Sự kiện (đi học, đi làm, hẹn hò, đám cưới).
        3. Sở thích cá nhân.
        
        Hãy trả lời ngắn gọn (dưới 100 từ), giọng điệu thân thiện, cute, sử dụng nhiều emoji như 💅, ✨, 🌸, 🎀.
        Nếu khách hỏi về giá, hãy nhắc họ xem bảng giá ở mục 'Dịch Vụ' hoặc sử dụng tính năng 'Báo Giá AI' mới.`,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({
      message: newMessage
    });

    return result.text || "Xin lỗi, tôi không thể đưa ra câu trả lời ngay lúc này.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Đã có lỗi xảy ra khi kết nối với AI. Bạn vui lòng thử lại sau nhé!";
  }
};

export const analyzeNailImage = async (imageFile: File): Promise<PricingResult> => {
  if (!aiClient) {
    throw new Error("LỖI CẤU HÌNH: Chưa tìm thấy API Key trong biến môi trường. Vui lòng thêm API_KEY vào Vercel Settings.");
  }

  const imagePart = await fileToGenerativePart(imageFile);
  
  const prompt = `
    Đóng vai là thợ nail chuyên nghiệp tại Ki Nail Room. Phân tích ảnh và báo giá JSON.
    
    BẢNG GIÁ:
    1. NỀN: Cắt da 30k (luôn có) + Sơn Gel 80k.
    2. FORM: Móng ngắn (0k), Up keo (80k), Up base (120k), Đắp gel (200k).
    3. ART: Mắt mèo/Tráng gương (+70k/bộ), Ombre (+70k/bộ), Vẽ đơn giản (10k/ngón), Vẽ hoạt hình (25k/ngón).
    4. CHARM: Đá nhỏ (15k/ngón), Đá full (40k/ngón), Charm to (20k/cái).

    Yêu cầu: Trả về JSON hợp lệ (không markdown \`\`\`json).
    Format:
    {
      "items": [{ "item": "Tên", "cost": 10000, "reason": "Chi tiết" }],
      "totalEstimate": 100000,
      "note": "Nhận xét ngắn."
    }
  `;

  try {
    const result = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
            imagePart,
            { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        // Setting safety settings to BLOCK_NONE to avoid false positives on hand images
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }
    });

    if (result.text) {
        try {
            return JSON.parse(result.text) as PricingResult;
        } catch (e) {
            console.error("JSON Parse Error:", result.text);
            throw new Error("AI trả về dữ liệu không đúng định dạng JSON. Vui lòng thử lại.");
        }
    }
    throw new Error("AI không trả về kết quả nào (Empty response).");
  } catch (error: any) {
    console.error("Vision AI Error Detail:", error);
    // Extract meaningful error message
    let msg = error.message || "Lỗi không xác định";
    if (msg.includes("403")) msg = "Lỗi xác thực (403): API Key không hợp lệ hoặc đã hết hạn mức.";
    if (msg.includes("400")) msg = "Lỗi yêu cầu (400): Ảnh không hợp lệ hoặc sai định dạng.";
    throw new Error(msg);
  }
};