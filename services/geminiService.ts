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

    NHIỆM VỤ 1: KIỂM DUYỆT NỘI DUNG
    Hãy nhìn vào bức ảnh và xác định: Đây có phải là ảnh liên quan đến Móng tay, Móng chân, Bàn tay, Bàn chân hoặc Mẫu Nail Art không?
    - Nếu KHÔNG (Ví dụ: Ảnh selfie mặt người, đồ ăn, phong cảnh, xe cộ...): 
      -> Trả về JSON lỗi: {"error": "Xin lỗi bạn, AI của Ki Nail Room chỉ có thể phân tích và báo giá dịch vụ Nail thôi ạ. Tụi mình không hỗ trợ phân tích hình ảnh khác. Bạn vui lòng tải lên ảnh mẫu móng nhé! 💅✨"}

    NHIỆM VỤ 2: BÁO GIÁ CHI TIẾT (NẾU LÀ ẢNH NAIL)
    
    *** VÍ DỤ VÀNG SỐ 1 (CASE STUDY CHUẨN - FRENCH ĐỎ & HỌA TIẾT NƠ/CHERRY):
    Khách gửi ảnh mẫu: Tay làm móng úp form nhọn/bầu, sơn nền nude trong trẻo. Có vẽ french đầu móng màu đỏ (khoảng 6 ngón). Có vẽ dây nơ trắng mảnh và vẽ quả cherry đỏ (khoảng 5 ngón). Đính đá nhỏ (khoảng 14 viên).
    QUY TẮC QUAN TRỌNG: 
    - Màu đỏ ở đầu móng đã tính trong giá "French", KHÔNG TÍNH tiền "Sơn thêm màu".
    - Đá chỉ đếm những viên thực sự nổi khối. Các đốm sáng do đèn phản chiếu vào gel bóng KHÔNG PHẢI LÀ ĐÁ.
    => AI phải tính ra kết quả tương tự như sau:
    1. Up móng base: 120.000 VNĐ
    2. Sơn gel: 80.000 VNĐ
    3. French (6 ngón x 10.000): 60.000 VNĐ
    4. Vẽ đơn giản (5 ngón x 15.000): 75.000 VNĐ (Vẽ nơ trắng, vẽ cherry)
    5. Đá nhỏ (14 viên x 3.000): 42.000 VNĐ
    => TỔNG CỘNG: 377.000 VNĐ

    *** VÍ DỤ VÀNG SỐ 2 (CASE STUDY NÂNG CAO - OMBRE & TRÁNG GƯƠNG):
    Khách gửi ảnh mẫu: Móng úp form base nhọn/dài, sơn hiệu ứng ombre loang màu toàn bộ móng, VÀ có lớp tráng gương bóng lộn (chrome) lên trên toàn bộ. Đính đá ở chân móng (gồm đá nhỏ và đá khối vừa).
    QUY TẮC: Nếu thấy móng bóng loáng như kim loại/ngọc trai => CÓ Tráng gương. Ombre và Tráng gương tính riêng từng bộ.
    => AI phải tính như sau:
    1. Up móng base: 120.000 VNĐ
    2. Sơn gel: 80.000 VNĐ
    3. Ombre bộ: 70.000 VNĐ
    4. Tráng gương bộ: 70.000 VNĐ
    5. Đá nhỏ (4 viên x 3.000): 12.000 VNĐ
    6. Đá phối (10 viên x 4.000): 40.000 VNĐ
    => TỔNG CỘNG: 392.000 VNĐ

    *** VÍ DỤ VÀNG SỐ 3 (CASE STUDY HỖN HỢP - SƠN THÊM MÀU & MIX DESIGN):
    Khách gửi ảnh mẫu: Tay móng thật (độ dài vừa phải), sơn gel (sơn 2 màu nền khác nhau: đỏ và nude). Có 2 ngón vẽ French đỏ. Có 2 ngón vẽ hoa loang kết hợp đính hạt vàng ở giữa nhụy.
    QUY TẮC:
    1. Móng này độ dài trung bình -> TÍNH LÀ MÓNG THẬT (0đ), KHÔNG TÍNH Up móng.
    2. Ngón có hoa + hạt vàng: Vì vừa có vẽ, vừa có phụ kiện -> Tính gộp vào giá "Trang trí vẽ + phụ kiện nhỏ" (20k/ngón). KHÔNG tách lẻ thành vẽ riêng đá riêng.
    => AI phải tính như sau:
    1. Sơn gel: 80.000 VNĐ
    2. Sơn thêm 1 màu: 10.000 VNĐ
    3. French (2 ngón x 10.000): 20.000 VNĐ
    4. Trang trí vẽ + phụ kiện nhỏ (2 ngón x 20.000): 40.000 VNĐ
    => TỔNG CỘNG: 150.000 VNĐ

    *** VÍ DỤ VÀNG SỐ 4 (CASE STUDY VẼ GEL BÒ SỮA - MÓNG NGẮN):
    Khách gửi ảnh mẫu: Tay móng vuông ngắn, sơn gel phối 3 màu (xanh, đen, nền móng), vẽ họa tiết bò sữa trên 6 ngón, có đính hạt nhỏ li ti giả làm họa tiết.
    LƯU Ý: Móng ngắn nên KHÔNG TÍNH Up móng. KHÔNG TÍNH Cắt da. Các hạt nhỏ li ti được tính gộp vào công vẽ, KHÔNG TÍNH là đá.
    => AI phải tính như sau:
    1. Sơn gel: 80.000 VNĐ
    2. Sơn thêm 2 màu: 20.000 VNĐ
    3. Vẽ gel (6 ngón x 20.000): 120.000 VNĐ
    => TỔNG CỘNG: 220.000 VNĐ

    *** VÍ DỤ VÀNG SỐ 5 (CASE STUDY NHŨ VÀNG & VẼ NỔI TRÁNG GƯƠNG):
    Khách gửi ảnh mẫu: Tay làm móng úp base, sơn gel tông đen lì, có phối thêm màu nhũ vàng ở 8 ngón, và 2 ngón vẽ gân nổi tráng gương vàng.
    QUY TẮC QUAN TRỌNG: Mặc dù đã tính tiền Nhũ Vàng (Design), nhưng vì đây là phối màu (Đen + Vàng) nên VẪN PHẢI TÍNH tiền "Sơn thêm 1 màu".
    => AI phải tính như sau:
    1. Up móng base: 120.000 VNĐ
    2. Sơn gel: 80.000 VNĐ
    3. Sơn thêm 1 màu: 10.000 VNĐ (Lý do: Phối đen và nhũ vàng)
    4. Nhũ vàng (8 ngón x 10.000): 80.000 VNĐ
    5. Vẽ nổi + tráng gương (2 ngón x 15.000): 30.000 VNĐ
    => TỔNG CỘNG: 320.000 VNĐ

    *** VÍ DỤ VÀNG SỐ 6 (FRENCH BIẾN TẤU):
    Khách gửi ảnh mẫu: Móng nhọn, đầu móng sơn màu (xanh, đỏ, tím, vàng...) hoặc đầu móng chữ V (V-cut).
    QUY TẮC: Dù đầu móng màu gì, hình dáng gì (tròn, V, xéo), miễn là kiểu sơn đầu móng thì ĐỀU TÍNH LÀ FRENCH (10k/ngón). Đừng tính nhầm thành Vẽ đơn giản.
    => AI phải tính: French (x số ngón).

    *** BẢNG GIÁ CHI TIẾT & QUY TẮC TÍNH:

    1. DỊCH VỤ NỀN & FORM:
       - Cắt da/Sửa móng: 30.000 VNĐ (KHÔNG TỰ ĐỘNG THÊM).
       - Sơn Gel trơn: 80.000 VNĐ.
       - Up móng base: 120.000 VNĐ. (CHỈ CHỌN NẾU móng trông RẤT DÀI, hoặc TRONG SUỐT).

    2. DESIGN / ART (Đếm số ngón thực tế):
       - French đầu móng (bao gồm V-cut, Chéo, Baby Boomer viền): 10.000 VNĐ / ngón.
       - Vẽ đơn giản (hoa nhỏ, tim, line, nơ): 15.000 VNĐ / ngón.
       - Vẽ gel (họa tiết trung bình): 20.000 VNĐ / ngón.
       - Trang trí mix (Vừa vẽ vừa phụ kiện nhỏ): 20.000 VNĐ / ngón.
       - Nhũ vàng / Dát vàng / Ẩn nhũ: 10.000 VNĐ / ngón.
       - Vẽ nổi + Tráng gương: 15.000 VNĐ / ngón.

    3. PHỤ KIỆN (CHARM / ĐÁ):
       - Đính đá nhỏ: 3.000 VNĐ / viên.
       - Đính đá phối: 4.000 VNĐ / viên.
       - Charm: 20.000 VNĐ / cái.
       - *** LƯU Ý ĐẶC BIỆT VỀ ĐẾM ĐÁ (CHỐNG ẢO GIÁC): ***
         AI thường đếm nhầm bóng sáng phản quang hoặc chấm bi vẽ thành đá.
         => HÃY ĐẾM BẢO THỦ (CONSERVATIVE). Chỉ đếm những viên có khối 3D rõ ràng.
         => Nếu thấy một vùng lấp lánh nhiều điểm nhỏ, hãy coi đó là "Rắc nhũ" hoặc "1 viên đá khối/charm", đừng đếm vụn vặt thành 20-30 viên.
         => Ví dụ: Nhìn thấy 18 điểm sáng, nhưng chỉ có 8 viên rõ nét -> Chọn 8.

    LƯU Ý KHI SUY LUẬN:
    - Nếu phân vân giữa các mức giá, hãy chọn MỨC GIÁ THẤP để báo giá mang tính tham khảo.
    
    Yêu cầu trả về JSON chuẩn (Chỉ trả về Raw JSON, KHÔNG dùng Markdown):
    {
      "items": [
        { "item": "Sơn Gel trơn", "cost": 80000, "reason": "Sơn nền" },
        { "item": "Đính đá nhỏ (8 viên)", "cost": 24000, "reason": "3.000đ x 8 viên (đếm bảo thủ)" }
      ],
      "totalEstimate": 104000,
      "note": "..."
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
        temperature: 0, 
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
    throw new Error(msg);
  }
};