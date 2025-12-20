
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V106_RESTORE_ORIGINAL_QUOTE_FORMAT
// TÍNH NĂNG: Trả lại đúng giao diện báo giá cũ + Giữ bộ não Gemini 3 chỉ trả lời Địa chỉ/Giá/KM.

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
            // Định dạng ◽ và dấu : như trong hình
            itemsText = items.map(i => `◽ ${i.item}: ${new Intl.NumberFormat('vi-VN').format(i.cost)}đ`).join('\n');
        } catch (e) { itemsText = "Chi tiết đang được xử lý..."; }

        const total = new Intl.NumberFormat('vi-VN').format(f["Total Estimate"] || 0);

        // FORM BÁO GIÁ CHUẨN THEO HÌNH ẢNH
        const breakdownText = `📋 CHI TIẾT BÁO GIÁ AI:\n\n${itemsText}\n\n--------------------\n💰 TỔNG CỘNG: ${total}đ\n--------------------\nGiá này do AI của Ki Nail gửi trước cho mình để tham khảo thôi nhen.`;

        return {
            intro: `🎊 Ki đã nhận được yêu cầu báo giá! Nàng đợi xíu Ki tải chi tiết cho nha... 💅✨`,
            breakdown: breakdownText,
            image: f["Image URL"] || null
        };
    } catch (e) { return null; }
}

// ============================================================
// 2. BỘ NÃO GEMINI 3 FLASH (HỎI ĐỊA CHỈ/GIÁ THÌ NÓI - CÒN LẠI IM LẶNG)
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
                    QUY TẮC:
                    1. Chỉ trả lời nếu khách hỏi về: ĐỊA CHỈ, GIÁ TIỀN/MENU, KHUYẾN MÃI.
                    2. Nếu khách hỏi đúng 3 chủ đề trên: Trả lời cực kỳ lễ phép, cute có icon.
                    3. Nếu khách hỏi bất kỳ điều gì khác: TRẢ LỜI DUY NHẤT CỤM TỪ: __SILENCE__

                    KIẾN THỨC:
                    ${knowledge}
                `,
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 1000 }
            }
        });
        const reply = response.text.trim();
        if (reply.includes("__SILENCE__")) return null;
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

            // --- A. ƯU TIÊN 1: BÁO GIÁ AI (GỬI THEO FORM HÌNH ẢNH) ---
            let recordId = null;
            if (event.referral && event.referral.ref) recordId = event.referral.ref;
            if (event.postback && event.postback.referral && event.postback.referral.ref) recordId = event.postback.referral.ref;

            if (recordId) {
                const quote = await getQuoteFromAirtable(recordId);
                if (quote) {
                    // 1. Gửi câu chào intro
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: quote.intro });
                    // 2. Gửi ảnh mẫu
                    if (quote.image) await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, psid, quote.image);
                    // 3. Gửi bảng kê chi tiết
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: quote.breakdown });
                    // 4. Gửi nút Chat với nhân viên
                    await sendFacebookButton(FB_PAGE_ACCESS_TOKEN, psid, 
                        "Để xem thông tin chi tiết, nàng bấm vào nút bên dưới. Ki Nail sẽ tư vấn cụ thể và giải đáp cho mình ạ.",
                        [{ type: "postback", title: "Chat Với Nhân Viên", payload: "CHAT_WITH_STAFF" }]
                    );
                    continue; 
                }
            }

            // --- B. ƯU TIÊN 2: TIN NHẮN CHAT TỰ NHIÊN (CHỈ NÓI NẾU HỎI GIÁ/ĐỊA CHỈ) ---
            if (event.message && event.message.text) {
                const text = event.message.text.trim();
                
                if (text.toLowerCase() === 'ping kinail') {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: "Hệ thống Ki Nail Room [V106] khôi phục giao diện báo giá thành công! 💅✨" });
                    continue;
                }

                const knowledge = await getSalonKnowledge();
                const aiReply = await askGemini(text, knowledge);
                
                if (aiReply) {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: aiReply });
                }
            }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}

// --- HELPERS GỬI TIN NHẮN FACEBOOK ---
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
            payload: {
                template_type: "button",
                text: text,
                buttons: buttons
            }
        }
    });
}
