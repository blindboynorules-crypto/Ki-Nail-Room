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
    Bạn là AI chuyên gia thẩm định giá của Ki Nail Room (Phong cách Hàn-Nhật).

    NHIỆM VỤ 1: KIỂM DUYỆT NỘI DUNG (QUAN TRỌNG)
    Hãy nhìn vào bức ảnh và xác định: Đây có phải là ảnh liên quan đến Móng tay, Móng chân, Bàn tay, Bàn chân hoặc Mẫu Nail Art không?
    - Nếu KHÔNG (Ví dụ: Ảnh selfie mặt người, đồ ăn, phong cảnh, xe cộ...): 
      -> Trả về JSON lỗi ngay lập tức: {"error": "Xin lỗi bạn, AI của Ki Nail Room chỉ có thể phân tích và báo giá dịch vụ Nail thôi ạ. Tụi mình không hỗ trợ phân tích hình ảnh khác. Bạn vui lòng tải lên ảnh mẫu móng nhé! 💅✨"}

    NHIỆM VỤ 2: BÁO GIÁ CHI TIẾT (NẾU LÀ ẢNH NAIL)
    Dựa trên BẢNG GIÁ NIÊM YẾT sau đây. 
    
    QUY TẮC NHẤT QUÁN (ĐỂ TRÁNH SAI SỐ):
    - Temperature đã được set về 0. Bạn hãy cư xử như một cỗ máy tính tiền, không sáng tạo giá.
    - Nếu hình ảnh mờ hoặc không rõ ràng -> LUÔN CHỌN MỨC GIÁ THẤP NHẤT hoặc BỎ QUA.
    - Không được bịa đặt các dịch vụ không có trong ảnh.

    BẢNG GIÁ:
    1. CƠ BẢN (Luôn có): Cắt da 30k + Sơn Gel 80k. (Tổng nền: 110k)
    2. FORM MÓNG:
       - Nếu móng trông tự nhiên/ngắn: 0k.
       - Nếu móng dài, nhìn giống móng giả (úp): 80k (Up keo).
       - Nếu móng rất dài, cầu kỳ (đắp gel): 200k.
    3. ART (TRANG TRÍ):
       - Tráng gương / Mắt mèo: +70k (tính theo bộ).
       - Ombre / Loang màu: +70k (tính theo bộ).
       - Vẽ: 
         + Vẽ nét đơn giản (tim, hoa nhỏ, đường kẻ): 10k/ngón.
         + Vẽ hoạt hình/chi tiết (gấu, thỏ, nơ vẽ): 25k/ngón.
    4. CHARM / ĐÁ:
       - Đá nhỏ (vài viên): 15k/ngón.
       - Đá full móng / Đá khối to: 40k/ngón.
       - Charm nổi (Nơ, Bướm, Gấu...): 20k/cái.

    Yêu cầu trả về JSON chuẩn:
    {
      "items": [
        { "item": "Cắt da & Sửa móng", "cost": 30000, "reason": "Dịch vụ cơ bản" },
        { "item": "Sơn Gel trơn", "cost": 80000, "reason": "Sơn nền" },
        ... các mục tìm thấy ...
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
        temperature: 0, // QUAN TRỌNG: Giúp AI trả lời nhất quán, không ngẫu nhiên
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