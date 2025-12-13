
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

// CHAT CONSULTATION (Now calls Backend with Grounding Support)
export const getAiConsultation = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  try {
    const prompt = `
        Bạn là chuyên gia tư vấn Nail tại Ki Nail Room (Phong cách Hàn-Nhật).
        Lịch sử chat: ${JSON.stringify(history.map(m => ({ role: m.role, text: m.text })))}
        Khách hỏi: ${newMessage}
        
        Trả lời ngắn gọn, cute, dùng emoji. Nếu khách hỏi về xu hướng hoặc thông tin cụ thể, hãy sử dụng thông tin tìm kiếm được.
        Nếu hỏi giá, nhắc xem menu.
    `;
    
    // Call API with 'chat' type to enable Grounding (Google Search)
    const response = await fetch('/api/analyze-nail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: prompt,
            type: 'chat'
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Chat Error");
    
    let finalText = data.text || "";

    // Process Grounding Sources (Append to text for display)
    if (data.groundingMetadata?.groundingChunks) {
         const sources = data.groundingMetadata.groundingChunks
            .filter((c: any) => c.web?.uri && c.web?.title)
            .map((c: any, index: number) => `[${index + 1}. ${c.web.title}](${c.web.uri})`)
            .join('\n');

         if (sources) {
             finalText += `\n\n📚 **Nguồn tham khảo:**\n${sources}`;
         }
    }

    return finalText;

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
    
    *** BẢNG GIÁ NIÊM YẾT (ĐƠN VỊ: VNĐ - VIẾT ĐẦY ĐỦ SỐ 0):
    
    1. DỊCH VỤ NỀN & FORM (BẮT BUỘC): 
       - Cắt da/Sửa móng: 30.000
       - Sơn Gel trơn: 80.000 (Luôn tính mục này nếu có sơn màu)
       - Up móng base: 120.000 (Một trăm hai mươi nghìn - Dành cho móng dài, form chuẩn giả).
       => LƯU Ý QUAN TRỌNG: Nếu là móng úp/nối, phải tính CẢ HAI: Up móng base (120.000) + Sơn gel (80.000).

    2. MÀU SẮC (SƠN THÊM):
       - Sơn 1 màu chủ đạo: Không tính thêm.
       - Sơn 2 màu (Thêm 1 màu): +10.000
       - Sơn 3 màu trở lên (Thêm 2 màu): +20.000

    3. DESIGN TRANG TRÍ (TÍNH THEO NGÓN/BỘ):
       Hãy cố gắng đếm số lượng ngón có design.
       - French (Kẻ đầu móng): 10.000 / ngón.
       - **Vẽ nét đơn giản (Level 1)**: 10.000 / ngón.
       - **Vẽ hình đơn giản (Level 2 - Nơ, trái tim, chấm bi)**: 15.000 / ngón.
       - **Vẽ Gel Họa Tiết (Level 3 - Bò sữa, Caro, Vẽ full móng)**: 20.000 / ngón.
       - Vẽ gel nổi / Charm / Sticker: 20.000 / ngón.
       - **Nhũ (Vàng/Bạc/Kim tuyến)**: 10.000 / ngón.
       - **Combo Vẽ nổi + Tráng gương (Trên cùng 1 ngón)**: 15.000 / ngón.
       - **Combo Vẽ + Phụ kiện nhỏ trên cùng 1 ngón**: 20.000 / ngón.
       
       - Mắt mèo (Nhận diện rõ loại: Kim cương, Flash, Ánh trăng/Moonlight, 9D, Má hồng/Blush): 130.000 - 150.000 / bộ (Đã bao gồm nền).
       - Tráng gương (Nhận diện rõ loại: Kim loại/Metallic (70.000), Ngọc trai/Aurora (80.000), Cầu vồng/Hologram (80.000)): 70.000 - 80.000 / bộ.
       
       => LƯU Ý COMBO: 
       - Mắt mèo/Ombre + Tráng gương chồng lên nhau -> Tính tiền cả hai (Ví dụ: 70.000 + 70.000).
       - French đầu móng + Tráng gương (French Chrome) -> Tính tiền cả hai (French 10.000/ngón + Tráng gương 70.000/bộ).

    4. PHỤ KIỆN (ĐÁ): 
       - Đá nhỏ: 3.000 / viên.
       - Đá phối (Size vừa, charm nhỏ): 10.000 / viên.
       - Đá khối (Đá to): 15.000 - 35.000 / viên.

    *** CÁC VÍ DỤ TÍNH TIỀN MẪU (HÃY HỌC THUỘC LÒNG):
    (Examples retained for brevity - removed to save space but logic is updated)
    
    Yêu cầu trả về JSON chuẩn:
    {
      "items": [
        { "item": "Tên dịch vụ", "cost": 0, "reason": "Giải thích cách tính" }
      ],
      "totalEstimate": 0,
      "note": "Lời nhận xét của AI"
    }
  `;

  try {
    const response = await fetch('/api/analyze-nail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imageBase64: data,
            mimeType: mimeType,
            prompt: prompt,
            type: 'pricing' // Explicitly set type
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
