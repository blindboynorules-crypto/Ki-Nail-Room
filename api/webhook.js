
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V110_STRICT_RECOGNITION
// TÍNH NĂNG: Phân biệt câu hỏi Tổng và câu hỏi Chi tiết. Im lặng đúng lúc.

// ============================================================
// 1. TRUY VẤN KIẾN THỨC TỪ AIRTABLE (LẤY CẢ ẢNH)
// ============================================================
let _botRulesCache = null;
let _lastFetchTime = 0;

async function getBotRules() {
    const NOW = Date.now();
    if (_botRulesCache && (NOW - _lastFetchTime < 120000)) return _botRulesCache;

    const token = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token || !baseId) return [];

    try {
        const res = await fetch(`https://api.airtable.com/v0/${baseId}/BotConfig?maxRecords=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.records) return [];

        const rules = data.records.map(r => ({
            keyword: (r.fields.Keyword || "").toUpperCase(),
            answer: r.fields.Answer || "",
            imageUrl: (Array.isArray(r.fields.Attachments) && r.fields.Attachments.length > 0) 
                      ? r.fields.Attachments[0].url 
                      : null
        }));
        
        _botRulesCache = rules;
        _lastFetchTime = NOW;
        return rules;
    } catch (e) { return []; }
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
            itemsText = items.map(i => `◽ ${i.item}: ${new Intl.NumberFormat('vi-VN').format(i.cost)}đ`).join('\n');
        } catch (e) { itemsText = "Chi tiết báo giá..."; }

        const total = new Intl.NumberFormat('vi-VN').format(f["Total Estimate"] || 0);

        return {
            intro: `🎊 Ki đã nhận được yêu cầu báo giá! Nàng đợi xíu Ki tải chi tiết cho nha... 💅✨`,
            breakdown: `📋 CHI TIẾT BÁO GIÁ AI:\n\n${itemsText}\n\n--------------------\n💰 TỔNG CỘNG: ${total}đ\n--------------------\nGiá này do AI của Ki Nail gửi trước cho mình để tham khảo thôi nhen.`,
            image: f["Image URL"] || null
        };
    } catch (e) { return null; }
}

// ============================================================
// 2. BỘ NÃO PHÂN LOẠI THÔNG MINH (V110)
// ============================================================
async function classifyIntent(userMessage, keywords) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMessage,
            config: {
                systemInstruction: `
                    Bạn là trợ lý lọc tin nhắn cho Ki Nail Room.
                    Nhiệm vụ: Chỉ trả lời các câu hỏi CHUNG CHUNG. Tuyệt đối im lặng với các câu hỏi CHI TIẾT.

                    DANH SÁCH TỪ KHÓA: [${keywords.join(", ")}]

                    QUY TẮC PHÂN LOẠI:
                    1. PRICE (Bảng giá tổng): Chỉ khi khách hỏi "menu", "bảng giá", "giá cả bên mình sao", "xin giá".
                       -> Nếu hỏi giá của MỘT DỊCH VỤ CỤ THỂ (VD: "giá móng úp hông", "nối móng nhiêu", "sơn gel nhiêu") -> TRẢ VỀ __SILENCE__.
                    2. ADDRESS (Địa chỉ): Khách hỏi "tiệm ở đâu", "địa chỉ", "xin map", "vị trí".
                    3. PROMOTION (Khuyến mãi): Khách hỏi "đợt này có sale hông", "có khuyến mãi gì không", "có ưu đãi hok".

                    LƯU Ý NGÔN NGỮ GEN Z:
                    - "hông", "hok", "ko", "k", "hem" -> Chỉ là trợ từ kết thúc câu hỏi, không phải từ khóa chính.
                    
                    QUY TẮC IM LẶNG TUYỆT ĐỐI (__SILENCE__):
                    - Hỏi giá dịch vụ cụ thể: "móng úp nhiêu", "vẽ móng nhiêu", "phá móng nhiêu"...
                    - Hỏi về kỹ thuật/thời gian/độ bền: "mẫu này bền hông", "làm lâu hông".
                    - Gửi ảnh rồi hỏi tư vấn.
                    - Chào hỏi, khen ngợi.

                    KẾT QUẢ: Duy nhất 1 từ (PRICE, ADDRESS, PROMOTION hoặc __SILENCE__).
                `,
                temperature: 0
            }
        });
        return response.text.trim().toUpperCase();
    } catch (error) { return "__SILENCE__"; }
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

            // --- A. BÁO GIÁ TỪ WEB ---
            let recordId = null;
            if (event.referral && event.referral.ref) recordId = event.referral.ref;
            if (event.postback && event.postback.referral && event.postback.referral.ref) recordId = event.postback.referral.ref;

            if (recordId) {
                const quote = await getQuoteFromAirtable(recordId);
                if (quote) {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: quote.intro });
                    if (quote.image) await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, psid, quote.image);
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: quote.breakdown });
                    await sendFacebookButton(FB_PAGE_ACCESS_TOKEN, psid, 
                        "Để xem thông tin chi tiết, nàng bấm vào nút bên dưới. Ki Nail sẽ tư vấn cụ thể và giải đáp cho mình ạ.",
                        [{ type: "postback", title: "Chat Với Nhân Viên", payload: "CHAT_WITH_STAFF" }]
                    );
                    continue; 
                }
            }

            // --- B. TIN NHẮN CHAT TỰ NHIÊN ---
            if (event.message && event.message.text) {
                const text = event.message.text.trim();
                
                if (text.toLowerCase() === 'ping kinail') {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: "Ki Nail Room [V110] - Logic Siết Chặt Đã Sẵn Sàng! 💅🛡️" });
                    continue;
                }

                const rules = await getBotRules();
                const keywords = rules.map(r => r.keyword);
                
                const intent = await classifyIntent(text, keywords);
                
                if (intent !== "__SILENCE__") {
                    const matchedRule = rules.find(r => r.keyword === intent);
                    if (matchedRule) {
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: matchedRule.answer });
                        if (matchedRule.imageUrl) {
                            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, psid, matchedRule.imageUrl);
                        }
                    }
                }
            }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}

// --- HELPERS ---
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

async function sendFacebookButton(token, psid, text, buttons) {
    await sendFacebookMessage(token, psid, {
        attachment: {
            type: "template",
            payload: { template_type: "button", text, buttons }
        }
    });
}
