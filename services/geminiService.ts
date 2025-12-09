import { GoogleGenAI } from "@google/genai";
import { ChatMessage, PricingResult } from "../types";

// Initialize Gemini
// NOTE: Ensure process.env.API_KEY is defined in your build tool (Vite)
const apiKey = process.env.API_KEY || ''; 

let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

export const isAiAvailable = (): boolean => !!aiClient;

// Helper to convert File to Base64 with Compression
// Optimization: Resize image to max 1024px and compress to JPEG to save bandwidth and ensure fast processing
// Việc này giúp giảm tải dung lượng gửi đi, tiết kiệm quota và tăng tốc độ phản hồi.
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        // Giới hạn kích thước tối đa là 1024px (đủ nét cho AI nhìn, nhưng nhẹ hơn nhiều so với ảnh gốc 4000px)
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
          // Compress to JPEG with 0.7 quality (Nén ảnh giảm dung lượng)
          const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
          resolve({
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
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

export const getAiConsultation = async (
  history: ChatMessage[],
  newMessage: string
): Promise<string> => {
  if (!aiClient) {
    return "Hệ thống chưa nhận được API Key. Vui lòng kiểm tra cấu hình Vercel (Settings > Environment Variables).";
  }

  try {
    // Sử dụng 'gemini-2.5-flash' - Model chuẩn hiện tại
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

  // Nén ảnh trước khi gửi để tối ưu tốc độ và chi phí
  const imagePart = await fileToGenerativePart(imageFile);
  
  const prompt = `
    Bạn là AI chuyên gia thẩm định giá của Ki Nail Room (Phong cách Hàn-Nhật).

    NHIỆM VỤ 1: KIỂM DUYỆT NỘI DUNG
    Hãy nhìn vào bức ảnh và xác định: Đây có phải là ảnh liên quan đến Móng tay, Móng chân, Bàn tay, Bàn chân hoặc Mẫu Nail Art không?
    - Nếu KHÔNG (Ví dụ: Ảnh selfie mặt người, đồ ăn, phong cảnh, xe cộ...): 
      -> Trả về JSON lỗi: {"error": "Xin lỗi bạn, AI của Ki Nail Room chỉ có thể phân tích và báo giá dịch vụ Nail thôi ạ. Tụi mình không hỗ trợ phân tích hình ảnh khác. Bạn vui lòng tải lên ảnh mẫu móng nhé! 💅✨"}

    NHIỆM VỤ 2: BÁO GIÁ CHI TIẾT (NẾU LÀ ẢNH NAIL)
    
    *** BẢNG GIÁ CHI TIẾT & QUY TẮC TÍNH:

    1. DỊCH VỤ NỀN & FORM:
       - Cắt da/Sửa móng: 30.000 VNĐ (KHÔNG TỰ ĐỘNG THÊM, chỉ thêm nếu ảnh móng rất xấu/sần sùi).
       - Sơn Gel trơn: 80.000 VNĐ.
       - Up móng base: 120.000 VNĐ. (CHỈ CHỌN NẾU móng trông RẤT DÀI, hoặc TRONG SUỐT. Móng ngắn/vuông -> Móng thật).

    2. MÀU SẮC (Sơn thêm):
       - Sơn thêm 1 màu (Tổng 2 màu trên bàn tay): +10.000 VNĐ.
       - Sơn thêm 2 màu (Tổng 3 màu trở lên): +20.000 VNĐ.
       - Lưu ý: Màu nhũ, màu kim tuyến, màu mắt mèo nếu phối với màu trơn -> Vẫn tính là Sơn thêm màu.

    3. DESIGN / ART (Đếm số ngón thực tế):
       - Mắt mèo kèm nền (Combo): 130.000 VNĐ / bộ. (Bao gồm mắt mèo thường, mắt mèo kim cương, mắt mèo aurora/ánh trăng. Đặc điểm: Có chiều sâu, vệt sáng hút nam châm).
       - Tráng gương bộ (Chrome/Aurora): 70.000 VNĐ / bộ (Hiệu ứng kim loại/xà cừ phủ toàn móng).
       - French đầu móng (bao gồm V-cut, Chéo, Baby Boomer viền): 10.000 VNĐ / ngón.
       - Vẽ đơn giản (hoa nhỏ, tim, nơ, CHẤM BI): 15.000 VNĐ / ngón.
       - Vẽ nét mảnh / Sticker / Họa tiết siêu nhỏ: 10.000 VNĐ / ngón.
       - Vẽ gel (họa tiết bò sữa, hoa văn phức tạp): 20.000 VNĐ / ngón.
       - Trang trí mix (Vừa vẽ vừa phụ kiện nhỏ): 20.000 VNĐ / ngón.
       - Nhũ vàng / Dát vàng / Ẩn nhũ: 10.000 VNĐ / ngón.
       - Vẽ nổi + Tráng gương: 15.000 VNĐ / ngón.

    4. PHỤ KIỆN (CHARM / ĐÁ):
       - Đính đá nhỏ: 3.000 VNĐ / viên.
       - Đính đá phối: 4.000 VNĐ / viên.
       - Charm: 20.000 VNĐ / cái.
       - *** LƯU Ý ĐẶC BIỆT VỀ ĐẾM ĐÁ (CHỐNG ẢO GIÁC): ***
         AI thường đếm nhầm bóng sáng phản quang hoặc chấm bi vẽ thành đá.
         => HÃY ĐẾM CẨN THẬN (theo AI phân tích số lượng). Chỉ đếm những viên có khối 3D rõ ràng.

    LƯU Ý KHI SUY LUẬN:
    - Nếu phân vân giữa các mức giá, hãy chọn MỨC GIÁ THẤP để báo giá mang tính tham khảo.
    
    Yêu cầu trả về JSON chuẩn (Chỉ trả về Raw JSON, KHÔNG dùng Markdown):
    {
      "items": [
        { "item": "Sơn Gel trơn", "cost": 80000, "reason": "Sơn nền" },
        { "item": "Đính đá nhỏ (8 viên)", "cost": 24000, "reason": "3.000đ x 8 viên (theo AI phân tích số lượng)" }
      ],
      "totalEstimate": 104000,
      "note": "..."
    }
  `;

  try {
    // Sử dụng 'gemini-2.5-flash' để tránh lỗi 404 (Not Found)
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
        temperature: 0, 
      }
    });

    if (result.text) {
        try {
            // Clean up Markdown code blocks
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
            if (e.message && e.message.includes("Xin lỗi bạn")) {
                throw e;
            }
            console.error("JSON Parse Error. Raw text:", result.text);
            throw new Error("AI trả về dữ liệu không đúng định dạng. Vui lòng thử lại ảnh khác.");
        }
    }
    throw new Error("AI không phản hồi.");
  } catch (error: any) {
    console.error("Vision AI Error Detail:", error);
    let msg = error.message || "Lỗi không xác định";
    if (msg.includes("403")) msg = "Lỗi xác thực (403): API Key không hợp lệ.";
    if (msg.includes("400")) msg = "Ảnh không hợp lệ hoặc sai định dạng.";
    if (msg.includes("429")) msg = "Hệ thống đang quá tải (429). Vui lòng thử lại sau vài giây.";
    if (msg.includes("404")) msg = "Lỗi kết nối AI (404). Đang thử lại với model khác...";
    throw new Error(msg);
  }
};