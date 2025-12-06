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
    - Đếm đá thật kỹ, tránh nhầm chấm bi gel trắng thành đá. Chỉ đếm viên nào có độ lấp lánh nổi khối.
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
    2. Ngón có hoa + hạt vàng: Vì vừa có vẽ, vừa có phụ kiện -> Tính vào "Trang trí vẽ + phụ kiện nhỏ" (20k/ngón). KHÔNG tách lẻ thành vẽ riêng đá riêng.
    => AI phải tính như sau:
    1. Sơn gel: 80.000 VNĐ
    2. Sơn thêm 1 màu: 10.000 VNĐ
    3. French (2 ngón x 10.000): 20.000 VNĐ
    4. Trang trí vẽ + phụ kiện nhỏ (2 ngón x 20.000): 40.000 VNĐ
    => TỔNG CỘNG: 150.000 VNĐ

    *** VÍ DỤ VÀNG SỐ 4 (CASE STUDY VẼ GEL BÒ SỮA - MÓNG NGẮN):
    Khách gửi ảnh mẫu: Tay móng vuông ngắn, sơn gel phối 3 màu (xanh, đen, nền móng), vẽ họa tiết bò sữa trên 6 ngón, có đính hạt nhỏ li ti giả làm họa tiết.
    LƯU Ý: Móng ngắn nên KHÔNG TÍNH Up móng. KHÔNG TÍNH Cắt da. Các hạt nhỏ li ti được tính gộp vào công vẽ.
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

    *** BẢNG GIÁ CHI TIẾT & QUY TẮC TÍNH:

    1. DỊCH VỤ NỀN & FORM (QUAN TRỌNG):
       - Cắt da/Sửa móng: 30.000 VNĐ (KHÔNG TỰ ĐỘNG THÊM, chỉ tính khi thấy rõ kềm cắt da hoặc khách yêu cầu trong prompt).
       - Sơn Gel trơn (1 màu chủ đạo): 80.000 VNĐ (Luôn có).
       - Móng thật: 0 VNĐ (Mặc định nếu móng ngắn, vuông, hoặc độ dài vừa phải).
       - Up móng keo (Form thường): 80.000 VNĐ.
       - Up móng base (Form chuẩn/đẹp): 120.000 VNĐ. (CHỈ CHỌN NẾU móng trông RẤT DÀI, hoặc TRONG SUỐT, hoặc có độ cong C-curve rõ rệt của móng giả).
       - Nối móng đắp gel (Rất dày/dài): 200.000 VNĐ.

    2. MÀU SẮC (Sơn thêm màu):
       - Sơn thêm 1 màu (Tổng 2 màu trên móng): +10.000 VNĐ.
       - Sơn thêm 2 màu (Tổng 3 màu trở lên): +20.000 VNĐ.
       - LƯU Ý 1: Nếu trên móng có phối màu Nhũ, Kim tuyến hoặc Tráng gương diện tích lớn cùng với màu trơn, VẪN TÍNH là "Sơn thêm màu".
       - LƯU Ý 2: Nếu màu sắc đó chỉ nằm ở đầu móng (French) hoặc là nét vẽ chi tiết (Art), KHÔNG TÍNH tiền "Sơn thêm màu".

    3. DESIGN / ART (Đếm số ngón thực tế):
       - French đầu móng: 10.000 VNĐ / ngón.
       - Vẽ đơn giản (hoa nhỏ, tim, line, nơ): 15.000 VNĐ / ngón.
       - Vẽ phức tạp (hoạt hình, chi tiết): 25.000 - 35.000 VNĐ / ngón.
       - Vẽ gel (họa tiết vừa/trung bình, vd: bò sữa, vân đá): 20.000 VNĐ / ngón.
       - Trang trí mix (Vừa vẽ vừa phụ kiện nhỏ): 20.000 VNĐ / ngón (ƯU TIÊN dùng gói này nếu ngón đó có cả vẽ và charm/đá).
       - Nhũ vàng / Dát vàng / Ẩn nhũ: 10.000 VNĐ / ngón.
       - Vẽ nổi + Tráng gương: 15.000 VNĐ / ngón (Combo đặc biệt).
       - Mắt mèo / Tráng gương (Full set): 70.000 VNĐ / bộ (hoặc 10k/ngón lẻ).
       - Ombre (Loang màu) (Full set): +70.000 VNĐ / bộ.

    4. PHỤ KIỆN (CHARM / ĐÁ):
       - Đính đá nhỏ (Đếm viên nếu được): 3.000 VNĐ / viên.
       - Đính đá phối (Vừa/Trung bình): 4.000 VNĐ / viên.
       - Đính đá full móng (Kín): 40.000 VNĐ / ngón.
       - Charm (Nơ, Bướm, Khối): 20.000 VNĐ / cái.

    LƯU Ý KHI SUY LUẬN:
    - Đừng đếm trùng lặp.
    - Nếu phân vân giữa các mức giá, hãy chọn MỨC GIÁ THẤP để báo giá mang tính tham khảo "từ...".
    - So sánh ảnh với 5 VÍ DỤ VÀNG để chọn cách tính phù hợp nhất.
    
    Yêu cầu trả về JSON chuẩn (Chỉ trả về Raw JSON, KHÔNG dùng Markdown):
    {
      "items": [
        { "item": "Sơn Gel trơn", "cost": 80000, "reason": "Sơn nền" },
        { "item": "Sơn thêm 2 màu", "cost": 20000, "reason": "Phối 3 màu" },
        { "item": "Vẽ gel (6 ngón)", "cost": 120000, "reason": "20.000đ x 6 ngón" }
      ],
      "totalEstimate": 220000,
      "note": "Mẫu nail bò sữa phối màu siêu xinh. Giá trên áp dụng cho móng thật."
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
        temperature: 0, // Zero temperature for deterministic output (học vẹt theo ví dụ)
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