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
    Bạn là AI chuyên gia của Ki Nail Room.

    NHIỆM VỤ QUAN TRỌNG NHẤT (BẮT BUỘC):
    Hãy nhìn vào bức ảnh và xác định xem đây có phải là hình ảnh liên quan đến làm móng (Nail) không?
    - Chấp nhận: Bàn tay, Bàn chân, Móng tay, Móng chân, Mẫu Nail Art, Móng giả (Nail Box), Dụng cụ làm nail.
    - TỪ CHỐI: Khuôn mặt người, Đồ ăn, Phong cảnh, Xe cộ, Thú cưng, Quần áo (không rõ tay), hoặc ảnh đen thui/mờ không rõ.

    NẾU KHÔNG PHẢI ẢNH NAIL:
    Trả về JSON duy nhất:
    {
      "error": "Xin lỗi bạn, AI của Ki Nail Room chỉ có thể phân tích và báo giá dịch vụ Nail thôi ạ. Tụi mình không hỗ trợ phân tích hình ảnh khác. Bạn vui lòng tải lên ảnh mẫu móng nhé! 💅✨"
    }

    NẾU LÀ ẢNH NAIL -> TIẾN HÀNH BÁO GIÁ:
    Dựa trên BẢNG GIÁ sau để tính toán (ước lượng):
    1. CƠ BẢN: Cắt da 30k (luôn cộng) + Sơn Gel 80k.
    2. FORM: Móng ngắn/tự nhiên (0k), Up keo (80k), Up base (120k), Đắp gel (200k).
    3. ART (Trang trí): 
       - Mắt mèo/Tráng gương: +70k/bộ.
       - Ombre/Loang: +70k/bộ.
       - Vẽ đơn giản: 10k/ngón.
       - Vẽ hoạt hình/chi tiết: 25k/ngón.
    4. CHARM/ĐÁ: 
       - Đá nhỏ/ít: 15k/ngón.
       - Đá full móng/Khối to: 40k/ngón.
       - Charm nơ/bướm: 20k/cái.

    Yêu cầu trả về JSON báo giá (nếu là ảnh nail):
    {
      "items": [
        { "item": "Cắt da & Sửa móng", "cost": 30000, "reason": "Dịch vụ cơ bản" },
        { "item": "Sơn Gel trơn", "cost": 80000, "reason": "Sơn nền" },
        ... các mục khác tìm thấy ...
      ],
      "totalEstimate": 150000,
      "note": "Nhận xét ngắn gọn về mẫu (VD: Mẫu ombre hồng thạch đính đá sang chảnh...)"
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
            const data = JSON.parse(result.text);
            
            // Kiểm tra xem AI có từ chối ảnh không (trường hợp trả về key "error")
            if (data.error) {
                throw new Error(data.error);
            }

            return data as PricingResult;
        } catch (e: any) {
            // Nếu là lỗi do mình throw ở trên (data.error) thì ném tiếp ra ngoài để hiển thị
            if (e.message && e.message.includes("Xin lỗi bạn")) {
                throw e;
            }
            console.error("JSON Parse Error:", result.text);
            throw new Error("AI trả về dữ liệu không đúng định dạng. Vui lòng thử lại ảnh khác.");
        }
    }
    throw new Error("AI không phản hồi.");
  } catch (error: any) {
    console.error("Vision AI Error Detail:", error);
    let msg = error.message || "Lỗi không xác định";
    
    // Customize generic errors
    if (msg.includes("403")) msg = "Lỗi xác thực (403): API Key không hợp lệ.";
    if (msg.includes("400")) msg = "Ảnh không hợp lệ hoặc sai định dạng.";
    
    throw new Error(msg);
  }
};