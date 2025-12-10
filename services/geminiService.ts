import { ChatMessage, PricingResult } from "../types";

// NOTE: We no longer import GoogleGenAI here to avoid exposing the SDK and Keys to the client.
// All AI requests are now proxied through /api/analyze-nail

export const isAiAvailable = (): boolean => {
  // Client always assumes backend is available. 
  // Real check happens when calling the API.
  return true; 
};

// Helper to convert File to Base64 (Keep existing optimization)
const fileToGenerativePart = async (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1024; 

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          resolve({
            data: base64Data,
            mimeType: 'image/jpeg',
          });
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// CHAT CONSULTATION (Now calls Backend)
export const getAiConsultation = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    const prompt = `
        Bạn là chuyên gia tư vấn Nail tại Ki Nail Room (Phong cách Hàn-Nhật).
        Lịch sử chat: ${JSON.stringify(history.map(m => ({ role: m.role, text: m.text })))}
        Khách hỏi: ${newMessage}
        
        Trả lời ngắn gọn, cute, dùng emoji. Nếu hỏi giá, nhắc xem menu.
    `;
    
    // 1x1 transparent pixel
    const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const response = await fetch('/api/analyze-nail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imageBase64: dummyImage,
            mimeType: 'image/png',
            prompt: prompt
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Chat Error");
    
    try {
        const jsonRes = JSON.parse(data.text);
        return jsonRes.answer || jsonRes.text || JSON.stringify(jsonRes);
    } catch (e) {
        return data.text; // Fallback if raw text
    }

  } catch (error) {
    console.error("Chat Proxy Error:", error);
    return "Hệ thống tư vấn đang bảo trì để nâng cấp bảo mật. Nàng quay lại sau nha!";
  }
};

// IMAGE ANALYSIS (Secure)
export const analyzeNailImage = async (imageFile: File): Promise<PricingResult> => {
  const { data, mimeType } = await fileToGenerativePart(imageFile);
  
  const prompt = `
    Bạn là AI chuyên gia thẩm định giá của Ki Nail Room (Phong cách Hàn-Nhật).

    NHIỆM VỤ 1: KIỂM DUYỆT NỘI DUNG
    Hãy nhìn vào bức ảnh và xác định: Đây có phải là ảnh liên quan đến Móng tay, Móng chân, Bàn tay, Bàn chân hoặc Mẫu Nail Art không?
    - Nếu KHÔNG (Ví dụ: Ảnh selfie mặt người, đồ ăn, phong cảnh, xe cộ...): 
      -> Trả về JSON lỗi: {"error": "Xin lỗi bạn, AI của Ki Nail Room chỉ có thể phân tích và báo giá dịch vụ Nail thôi ạ. Tụi mình không hỗ trợ phân tích hình ảnh khác. Bạn vui lòng tải lên ảnh mẫu móng nhé! 💅✨"}

    NHIỆM VỤ 2: PHÂN TÍCH VÀ BÁO GIÁ CHI TIẾT (CỘNG DỒN)
    Hãy quan sát kỹ từng chi tiết và CỘNG DỒN giá tiền như một người thợ tính tiền cho khách.
    
    *** BẢNG GIÁ NIÊM YẾT:
    
    1. DỊCH VỤ NỀN & FORM (BẮT BUỘC): 
       - Cắt da/Sửa móng: 30k
       - Sơn Gel trơn: 80k (Luôn tính mục này nếu có sơn màu)
       - Up móng base: 120k (Nếu thấy móng dài, form chuẩn giả).
       => LƯU Ý QUAN TRỌNG: Nếu là móng úp/nối, phải tính CẢ HAI: Up móng base (120k) + Sơn gel (80k).

    2. MÀU SẮC (SƠN THÊM):
       - Sơn 1 màu chủ đạo: Không tính thêm.
       - Sơn 2 màu (Thêm 1 màu): +10k.
       - Sơn 3 màu trở lên (Thêm 2 màu): +20k.

    3. DESIGN TRANG TRÍ (TÍNH THEO NGÓN/BỘ):
       Hãy cố gắng đếm số lượng ngón có design.
       - French (Kẻ đầu móng): 10k / ngón.
       - Vẽ đơn giản (Nét mảnh, hình nhỏ, nơ, trái tim): 15k / ngón.
       - Vẽ gel nổi / Charm / Sticker: 20k / ngón.
       - Mắt mèo (Các loại Kim cương/Flash/Moonlight/9D/Blush): 130k-150k / bộ (Thường tính trọn bộ).
       - Tráng gương (Metallic/Aurora/Hologram): 70k-80k / bộ.

    4. PHỤ KIỆN (ĐÁ): 
       - Đá nhỏ: 3k / viên (Hãy đếm số lượng viên đá trên ảnh).
       - Đá khối (Đá to): 15k-35k / viên.

    *** VÍ DỤ TÍNH TIỀN MẪU (HÃY HỌC THEO LOGIC NÀY):
    Khách làm bộ móng dài, có vẽ nơ và đính đá:
    - Up móng base: 120.000 (Vì móng dài)
    - Sơn gel: 80.000 (Nền màu)
    - French (6 ngón): 6 x 10.000 = 60.000
    - Vẽ đơn giản (5 ngón): 5 x 15.000 = 75.000
    - Đá nhỏ (14 viên): 14 x 3.000 = 42.000
    => TỔNG CỘNG: 377.000

    Yêu cầu trả về JSON chuẩn:
    {
      "items": [
        { "item": "Up móng base", "cost": 120000, "reason": "Móng dài form chuẩn" },
        { "item": "Sơn gel trơn", "cost": 80000, "reason": "Sơn nền" },
        { "item": "French đầu móng (x6)", "cost": 60000, "reason": "10k/ngón" },
        { "item": "Vẽ đơn giản (x5)", "cost": 75000, "reason": "15k/ngón" },
        { "item": "Đá nhỏ (x14)", "cost": 42000, "reason": "3k/viên" }
      ],
      "totalEstimate": 377000,
      "note": "AI đã đếm chi tiết số lượng ngón và đá. Giá thực tế có thể chênh lệch tùy size đá và độ khó thực tế."
    }
  `;

  try {
    const response = await fetch('/api/analyze-nail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imageBase64: data,
            mimeType: mimeType,
            prompt: prompt
        })
    });

    const result = await response.json();

    if (!response.ok) {
        // Handle specific error codes passed from backend
        const msg = result.message || "Lỗi hệ thống";
        if (msg.includes("429")) throw new Error("Hệ thống đang quá tải (429). Vui lòng thử lại sau.");
        throw new Error(msg);
    }

    if (result.text) {
        try {
            let cleanText = result.text.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const data = JSON.parse(cleanText);
            
            if (data.error) {
                throw new Error(data.error);
            }

            return data as PricingResult;
        } catch (e: any) {
            if (e.message && e.message.includes("Xin lỗi bạn")) throw e;
            console.error("JSON Parse Error", result.text);
            throw new Error("AI trả về dữ liệu không đúng định dạng. Vui lòng thử lại.");
        }
    }
    throw new Error("AI không phản hồi.");

  } catch (error: any) {
    console.error("Vision AI Error:", error);
    throw error;
  }
};