
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V102_FIX_QUOTE_RETRIEVAL
// TÍNH NĂNG: Sửa lỗi không nhận mã đơn hàng (ref) từ Website & Admin PING

// ============================================================
// 1. HÀM LẤY CẤU HÌNH BOT (MENU, ĐỊA CHỈ...) TỪ AIRTABLE
// ============================================================
let _botConfigCache = null;
let _lastFetchTime = 0;

async function getBotConfigFromAirtable() {
    const NOW = Date.now();
    if (_botConfigCache && (NOW - _lastFetchTime < 60000)) return _botConfigCache;

    const token = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token || !baseId) return null;

    try {
        const res = await fetch(`https://api.airtable.com/v0/${baseId}/BotConfig?maxRecords=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.records) return null;

        const config = {};
        data.records.forEach(r => {
            const k = r.fields.Keyword ? r.fields.Keyword.trim().toUpperCase() : null;
            if (k) {
                config[k] = {
                    text: r.fields.Answer || "Dạ Ki đang cập nhật ạ.",
                    image: r.fields.Attachments?.[0]?.url || r.fields.Image?.[0]?.url || null
                };
            }
        });
        _botConfigCache = config;
        _lastFetchTime = NOW;
        return config;
    } catch (e) { return null; }
}

// ============================================================
// 2. HÀM LẤY CHI TIẾT BÁO GIÁ (QUOTES) TỪ AIRTABLE
// ============================================================
async function getQuoteFromAirtable(recordId) {
    const token = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token || !baseId || !recordId) return null;

    try {
        const res = await fetch(`https://api.airtable.com/v0/${baseId}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        const f = data.fields;

        // Định dạng lại nội dung báo giá
        let itemsText = "";
        try {
            const items = JSON.parse(f["Items Detail"] || "[]");
            itemsText = items.map(i => `• ${i.item}: ${new Intl.NumberFormat('vi-VN').format(i.cost)}đ`).join('\n');
        } catch (e) { itemsText = "Chi tiết đang được xử lý..."; }

        const total = new Intl.NumberFormat('vi-VN').format(f["Total Estimate"] || 0);

        return {
            text: `✨ **BÁO GIÁ TẠM TÍNH TỪ AI** ✨\n\n${itemsText}\n\n💰 **TỔNG CỘNG: ${total}đ**\n\n📝 *Ghi chú: ${f["Note"] || "Mẫu này xinh xắn lắm nàng ơi!"}*\n\nNàng ưng mẫu này thì nhắn Ki đặt lịch nhen! 🥰💅`,
            image: f["Image URL"] || null
        };
    } catch (e) { return null; }
}

// ============================================================
// 3. DỮ LIỆU DỰ PHÒNG & ADMIN COMMANDS
// ============================================================
const FALLBACK_TEMPLATES = {
    PROMOTION: { text: "Dạ hiện tại Ki đang có ưu đãi giảm 10% cho khách đặt lịch trước nha.", image: null },
    VIEW_MENU: { text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!", image: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg" },
    ADDRESS: { text: "Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A, Bình Tân ạ.", image: null },
    ADMIN_PING: { text: "PONG! 🤖\n\nHệ thống Ki Nail Room đã được nâng cấp thành công:\n✅ Model: Gemini 3 Flash\n✅ Thinking: Đã kích hoạt\n✅ Quote Retrieval: Đã sửa lỗi (FIXED)\n✅ Status: Sẵn sàng phục vụ khách! 🥰💅", image: null }
};

// ============================================================
// 4. XỬ LÝ AI GEMINI (PHÂN LOẠI Ý ĐỊNH)
// ============================================================
async function classifyIntent(userMessage) {
    const t = userMessage.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes('ping kinail')) return 'ADMIN_PING';

    const apiKey = process.env.API_KEY;
    if (!apiKey) return "SILENCE"; 

    const ai = new GoogleGenAI({ apiKey });
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMessage,
            config: { 
                systemInstruction: 'Role: Receptionist. Intents: ADDRESS, VIEW_MENU, PROMOTION, SILENCE. Rules: Only return intent name.',
                temperature: 0.1, maxOutputTokens: 10 
            }
        });
        return result.text ? result.text.trim().toUpperCase() : "SILENCE";
    } catch (error) { return "SILENCE"; }
}

// ============================================================
// 5. MAIN HANDLER
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
            let recordId = null;

            // --- A. XỬ LÝ MÃ REF (TỪ WEBSITE) ---
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

            // --- B. XỬ LÝ TIN NHẮN CHAT THÔNG THƯỜNG ---
            if (event.message && event.message.text) {
                const text = event.message.text.trim();
                const intent = await classifyIntent(text);
                
                if (intent !== 'SILENCE') {
                    const config = await getBotConfigFromAirtable();
                    const resp = (config && config[intent]) ? config[intent] : FALLBACK_TEMPLATES[intent];
                    if (resp) {
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, psid, { text: resp.text });
                        if (resp.image) await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, psid, resp.image);
                    }
                }
            }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}

async function sendFacebookMessage(token, psid, message) {
    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: { id: psid }, message })
    });
}

async function sendFacebookImage(token, psid, url) {
    await sendFacebookMessage(token, psid, { attachment: { type: "image", payload: { url, is_reusable: true } } });
}
