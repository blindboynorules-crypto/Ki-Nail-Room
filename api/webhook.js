
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V105_STRICT_GEMINI_BRAIN
// TÍNH NĂNG: Chỉ trả lời Địa chỉ/Giá/KM + Báo giá AI từ Web. Còn lại IM LẶNG.

// ============================================================
// 1. TRUY VẤN KIẾN THỨC TỪ AIRTABLE
// ============================================================
let _botConfigCache = null;
let _lastFetchTime = 0;

async function getSalonKnowledge() {
    const NOW = Date.now();
    if (_botConfigCache && (NOW - _lastFetchTime < 120000)) return _botConfigCache;

    const token = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token || !baseId) return "";

    try {
        const res = await fetch(`https://api.airtable.com/v0/${baseId}/BotConfig?maxRecords=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.records) return "";

        let knowledgeBase = "DƯỚI ĐÂY LÀ KIẾN THỨC BẠN ĐÃ ĐƯỢC DẠY:\n";
        data.records.forEach(r => {
            const k = r.fields.Keyword || "INFO";
            const a = r.fields.Answer || "";
            knowledgeBase += `- ${k}: ${a}\n`;
        });
        
        _botConfigCache = knowledgeBase;
        _lastFetchTime = NOW;
        return knowledgeBase;
    } catch (e) { return ""; }
}

async function getQuoteFromAirtable(recordId) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token || !baseId || !recordId) return null;

    try {
        const res = await fetch(`https://api.airtable.com/v0/${baseId}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.fields) return null;
        const f = data.fields;
        
        let itemsText = "";
        try {
            const items = JSON.parse(f["Items Detail"] || "[]");
            itemsText = items.map(i => `• ${i.item}: ${new Intl.NumberFormat('vi-VN').format(i.cost)}đ`).join('\n');
        } catch (e) { itemsText = "Chi tiết báo giá..."; }

        const total = new Intl.NumberFormat('vi-VN').format(f["Total Estimate"] || 0);

        return {
            text: `✨ **BÁO GIÁ AI TỪ WEBSITE** ✨\n\n${itemsText}\n\n💰 **TỔNG CỘNG: ${total}đ**\n\n📝 *Ghi chú: ${f["Note"] || "Mẫu này xinh xắn lắm nàng ơi!"}*\n\nNàng ưng mẫu này thì nhắn Ki đặt lịch nhen! 🥰💅`,
            image: f["Image URL"] || null
        };
    } catch (e) { return null; }
}

// ============================================================
// 2. BỘ NÃO GEMINI 3 FLASH (CÓ CƠ CHẾ IM LẶNG)
// ============================================================
async function askGemini(userMessage, knowledge) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMessage,
            config: {
                systemInstruction: `
                    Bạn là lễ tân Ki Nail Room.
                    QUY TẮC PHẢN HỒI:
                    1. Chỉ được trả lời nếu câu hỏi của khách thuộc về: ĐỊA CHỈ, GIÁ TIỀN, MENU, KHUYẾN MÃI.
                    2. Nếu khách hỏi về 4 chủ đề trên: Dùng kiến thức được dạy, trả lời lễ phép, cute có icon.
                    3. Nếu khách hỏi bất kỳ điều gì khác (hỏi thăm, chào hỏi đơn thuần, tư vấn mẫu phức tạp, hỏi linh tinh...): BẮT BUỘC TRẢ LỜI DUY NHẤT CỤM TỪ: __SILENCE__
                    4. Tuyệt đối không tự ý hứa hẹn hay nói sai kiến thức đã dạy.

                    KIẾN THỨC ĐƯỢC DẠY:
                    ${knowledge}
                `,
                temperature: 0.1, // Giảm temperature để AI bớt "sáng tạo", tuân thủ quy tắc hơn
                thinkingConfig: { thinkingBudget: 1000 }
            }
        });
        const reply = response.text.trim();
        if (reply.includes("__SILENCE__")) return null; // Trả về null để Bot im lặng
        return reply;
    } catch (error) { return null; }
}

// ============================================================
// 3. MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    if (token === (process.env.FB_VERIFY_TOKEN || 'kinailroom_verify')) return res.status(200).send(req.query['hub.challenge']);
    return res.status(403).send('Failed');
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'page') {
      for (const entry of body.entry) {
        if (!entry.messaging) continue;
        for (const event of entry.messaging) {
            const psid = event.sender.id;

            // --- A. ƯU TIÊN 1: GỬI BÁO GIÁ TỪ WEBSITE (LUÔN GỬI) ---
            let recordId = null;
            if (event.referral && event.referral.ref) recordId = event.referral.ref;
            if (event.postback && event.postback.referral && event.postback.referral.ref) recordId = event.postback.referral.ref;

            if (recordId) {
                const quote = await getQuoteFromAirtable(recordId);
                if (quote) {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: quote.text });
                    if (quote.image) await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, psid, quote.image);
                    continue; 
                }
            }

            // --- B. ƯU TIÊN 2: TIN NHẮN CHAT (CHỈ TRẢ LỜI NẾU KHỚP KIẾN THỨC) ---
            if (event.message && event.message.text) {
                const text = event.message.text.trim();
                
                // Mã kiểm tra hệ thống dành cho Admin
                if (text.toLowerCase() === 'ping kinail') {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: "Hệ thống Ki Nail Room [V105] đã sẵn sàng.\n\n🤖 Chế độ: Gemini Strict Mode\n✅ Báo giá Web: OK\n✅ Trả lời Địa chỉ/Giá: OK\n🤫 Mọi câu hỏi khác: IM LẶNG" });
                    continue;
                }

                const knowledge = await getSalonKnowledge();
                const aiReply = await askGemini(text, knowledge);
                
                // CHỈ GỬI TIN NHẮN NẾU GEMINI KHÔNG TRẢ VỀ __SILENCE__
                if (aiReply) {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: aiReply });
                } else {
                    console.log(`[Bot] Đang im lặng với tin nhắn: "${text}" - Chờ Admin xử lý.`);
                }
            }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}

async function sendFacebookMessage(token, psid, message) {
    try {
        await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: { id: psid }, message })
        });
    } catch (e) {}
}

async function sendFacebookImage(token, psid, url) {
    await sendFacebookMessage(token, psid, { attachment: { type: "image", payload: { url, is_reusable: true } } });
}
