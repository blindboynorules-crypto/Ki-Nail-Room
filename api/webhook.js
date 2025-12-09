
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// CHẾ ĐỘ: HYBRID AI BOT (GEMINI 2.5 FLASH + KEYWORD FALLBACK)
// Sử dụng AI để hiểu ý định, nhưng trả lời bằng nội dung cứng để đảm bảo chuẩn xác.
// Updated: V40 Force Deploy

// ============================================================
// 1. DỮ LIỆU CÂU TRẢ LỜI MẪU (KHÔNG ĐƯỢC SỬA BỞI AI)
// ============================================================
const RESPONSE_TEMPLATES = {
    PROMOTION: {
        text: "Dạ Ki gởi mình chương trình khuyến mãi HOT hiện tại nha. Nàng xem qua kẻo lỡ ưu đãi xịn nè!",
        image: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207799/Noel2025_rxuc1y.jpg"
    },
    PRICE: {
        text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!",
        image: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
    },
    ADDRESS: {
        text: "Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A ( cũ ), Bình Tân ạ.\n\nNàng bấm vào link này để xem bản đồ chỉ đường cho tiện nha:\nhttps://maps.app.goo.gl/3z3iii6wd37JeJVp7?g_st=ipc",
        image: null
    }
};

// ============================================================
// 2. XỬ LÝ AI GEMINI
// ============================================================
async function classifyIntentWithGemini(userMessage) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Missing API_KEY");

    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt "Kỷ luật thép"
    const systemInstruction = `
    You are the Intent Classifier for Ki Nail Room's chatbot.
    Your ONLY job is to categorize the user's message into one of these 4 categories.
    
    CATEGORIES:
    1. ADDRESS: User asks for location, map, address, where is the shop. (Keywords: địa chỉ, ở đâu, map, đường nào, tọa độ, add...)
    2. PRICE: User asks for the general menu, price list, cost. (Keywords: bảng giá, menu, giá sao, bao nhiêu tiền, mắc không...)
    3. PROMOTION: User asks for discounts, sales, current offers. (Keywords: khuyến mãi, giảm giá, ưu đãi, km...)
    4. SILENCE: User asks for ANYTHING ELSE.
       - Booking/Appointment (e.g., "2 người được không", "đặt lịch 5h", "còn chỗ không").
       - Specific Price (e.g., "bộ này bao nhiêu", "mẫu này giá sao").
       - Small talk (e.g., "hi", "hello", "buồn quá", "xinh không").
       - Complaints or specific advice.

    RULES:
    - Ignore filler words (ạ, ơi, dạ, shop, ki, ad, mình muốn hỏi).
    - Output ONLY the category name: ADDRESS, PRICE, PROMOTION, or SILENCE.
    - Do NOT output Markdown or JSON. Just the word.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0, // Zero creativity, pure logic
                maxOutputTokens: 10,
            }
        });

        const intent = response.text ? response.text.trim().toUpperCase() : "SILENCE";
        
        // Safety check: Ensure valid intent
        if (['ADDRESS', 'PRICE', 'PROMOTION', 'SILENCE'].includes(intent)) {
            return intent;
        }
        return "SILENCE"; // Default to silence if AI hallucinates
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw error; // Throw to trigger fallback
    }
}

// ============================================================
// 3. XỬ LÝ TỪ KHÓA (FALLBACK KHI AI LỖI)
// ============================================================
function classifyIntentWithKeywords(text) {
    const t = text.toLowerCase();
    
    // Ưu tiên 1: Khuyến mãi
    if (t.includes('khuyen mai') || t.includes('giam gia') || t.includes('uu dai') || t.includes('km')) return 'PROMOTION';
    
    // Ưu tiên 2: Giá (phải check kỹ để tránh nhầm với "giảm giá")
    if ((t.includes('gia') || t.includes('menu') || t.includes('tien') || t.includes('phi')) && !t.includes('giam')) return 'PRICE';
    
    // Ưu tiên 3: Địa chỉ (Tránh từ "đc" vì dễ nhầm với "được")
    if (t.includes('dia chi') || t.includes('o dau') || t.includes('map') || t.includes('ban do') || t.includes('duong') || t.includes('add') || t.includes('location')) return 'ADDRESS';

    return 'SILENCE';
}

// ============================================================
// 4. MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
  // Xác minh Webhook (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
      if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Verification failed');
      }
    }
  }

  // Xử lý sự kiện (POST)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      try {
        for (const entry of body.entry) {
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;

            // XỬ LÝ POSTBACK / REF
            let refParam = null;
            if (webhook_event.referral) refParam = webhook_event.referral.ref;
            else if (webhook_event.postback?.referral) refParam = webhook_event.postback.referral.ref;
            else if (webhook_event.optin?.ref) refParam = webhook_event.optin.ref;

            if (refParam) {
                await handleReferral(sender_psid, refParam);
            } 
            // XỬ LÝ TIN NHẮN CHỮ (TEXT)
            else if (webhook_event.message && webhook_event.message.text) {
                const userMessage = webhook_event.message.text.trim();
                
                // LỆNH PING
                if (userMessage.toLowerCase() === 'ping') {
                    const statusMsg = `PONG! Bot Gemini 2.5 Flash [V40] Online.\nToken: ${FB_PAGE_ACCESS_TOKEN ? 'OK' : 'MISSING'}`;
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: statusMsg });
                    return res.status(200).send('EVENT_RECEIVED');
                }

                await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');

                // --- QUY TRÌNH XỬ LÝ ---
                let intent = 'SILENCE';
                let source = 'AI';

                try {
                    // 1. Thử dùng AI trước
                    intent = await classifyIntentWithGemini(userMessage);
                } catch (e) {
                    // 2. Nếu AI lỗi -> Dùng Keyword
                    console.warn("AI Failed, using Fallback:", e.message);
                    intent = classifyIntentWithKeywords(userMessage);
                    source = 'KEYWORD_FALLBACK';
                }

                console.log(`[BOT] Msg: "${userMessage}" -> Intent: ${intent} (${source})`);

                // --- PHẢN HỒI ---
                const template = RESPONSE_TEMPLATES[intent];
                
                if (template) {
                    // Gửi tin nhắn text
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: template.text });
                    
                    // Gửi ảnh nếu có
                    if (template.image) {
                        await new Promise(r => setTimeout(r, 500)); // Delay nhẹ
                        await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, template.image);
                    }
                } else {
                    // SILENCE: Không làm gì cả
                }

                await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
            }
          }
        }
      } catch (e) {
        console.error("Webhook Error:", e);
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not a page event');
  }
}

// --- HELPERS ---

async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;
    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');

    if (recordId && recordId.startsWith('MOCK_')) {
        await new Promise(r => setTimeout(r, 1000));
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "🚧 Đang hiển thị dữ liệu DEMO:" });
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: { type: "template", payload: { template_type: "button", text: "Đơn hàng mẫu: 150.000đ", buttons: [{ type: "postback", title: "Chat Nhân Viên", payload: "CHAT_HUMAN" }] } }
        });
        return;
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) return;

    try {
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` } });
        if (!airtableRes.ok) return;
        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total, "Items Detail": itemsJson } = record.fields;
        const fmt = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        
        let detailsText = "";
        try {
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) items.forEach(i => detailsText += `- ${i.item}: ${fmt(i.cost)}\n`);
        } catch (e) {}

        if (imageUrl) await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        const msgBody = `CHI TIẾT BÁO GIÁ:\n${detailsText}\nTỔNG CỘNG: ${fmt(total)}\n\nĐây là giá ước tính AI. Chat để chốt lịch nhé!`;
        
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: { type: "template", payload: { template_type: "button", text: msgBody.substring(0, 640), buttons: [{ type: "postback", title: "Chat Nhân Viên", payload: "CHAT_HUMAN" }] } }
        });
    } catch (error) { console.error("Referral Error:", error); }
}

async function sendSenderAction(token, psid, action) {
    try { await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, sender_action: action }) }); } catch (e) {}
}

async function sendFacebookMessage(token, psid, messageContent) {
    try { await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, message: messageContent }) }); } catch (e) {}
}

async function sendFacebookImage(token, psid, imageUrl) {
     await sendFacebookMessage(token, psid, { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } });
}