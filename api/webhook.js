
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// CHẾ ĐỘ: IM LẶNG LÀ VÀNG (SILENT ERROR MODE)
// CÔNG NGHỆ MỚI (V49): STATELESS QUOTE (Q_...)

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
    if (!apiKey) return "SILENCE"; 

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
    You are the Intent Classifier for Ki Nail Room's chatbot.
    Your ONLY job is to categorize the user's message into one of these 4 categories.
    
    CATEGORIES:
    1. ADDRESS: User asks for location, map, address. (Keywords: địa chỉ, ở đâu, map, đường nào, tọa độ, add...)
    2. PRICE: User asks for the general menu, price list. (Keywords: bảng giá, menu, giá sao, bao nhiêu tiền, mắc không...)
    3. PROMOTION: User asks for discounts, sales, current offers. 
       - Keywords: khuyến mãi, giảm giá, ưu đãi, km, ctkm...
       - IMPORTANT: If user asks about FUTURE promotions, CLASSIFY AS PROMOTION.
    4. SILENCE: User asks for ANYTHING ELSE (Booking, Specific Price, Chat, Complaints).

    RULES:
    - Output ONLY the category name: ADDRESS, PRICE, PROMOTION, or SILENCE.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0, 
                maxOutputTokens: 10,
            }
        });

        const intent = response.text ? response.text.trim().toUpperCase() : "SILENCE";
        if (['ADDRESS', 'PRICE', 'PROMOTION', 'SILENCE'].includes(intent)) return intent;
        return "SILENCE";
    } catch (error) {
        console.warn("Gemini AI Error (Silent):", error.message);
        throw error;
    }
}

// ============================================================
// 3. XỬ LÝ TỪ KHÓA (FALLBACK)
// ============================================================
function classifyIntentWithKeywords(text) {
    const t = text.toLowerCase();
    if (t.includes('khuyen mai') || t.includes('giam gia') || t.includes('uu dai') || t.includes('km') || t.includes('ctkm')) return 'PROMOTION';
    if ((t.includes('gia') || t.includes('menu') || t.includes('tien') || t.includes('phi')) && !t.includes('giam')) return 'PRICE';
    if (t.includes('dia chi') || t.includes('o dau') || t.includes('map') || t.includes('ban do') || t.includes('duong') || t.includes('add')) return 'ADDRESS';
    return 'SILENCE';
}

// ============================================================
// 4. MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
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

  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      try {
        for (const entry of body.entry) {
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;

            let refParam = null;
            if (webhook_event.referral) refParam = webhook_event.referral.ref;
            else if (webhook_event.postback?.referral) refParam = webhook_event.postback.referral.ref;
            else if (webhook_event.optin?.ref) refParam = webhook_event.optin.ref;

            if (refParam) {
                await handleReferral(sender_psid, refParam);
            } 
            else if (webhook_event.message && webhook_event.message.text) {
                const userMessage = webhook_event.message.text.trim();
                
                if (userMessage.toLowerCase() === 'ping') {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: `PONG! V49 Stateless Quote.\nToken: ${FB_PAGE_ACCESS_TOKEN ? 'OK' : 'MISSING'}` });
                    return res.status(200).send('EVENT_RECEIVED');
                }

                let intent = 'SILENCE';
                try {
                    intent = await classifyIntentWithGemini(userMessage);
                } catch (e) {
                    intent = classifyIntentWithKeywords(userMessage);
                }

                const template = RESPONSE_TEMPLATES[intent];
                if (template) {
                    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: template.text });
                    if (template.image) {
                        await new Promise(r => setTimeout(r, 500));
                        await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, template.image);
                    }
                    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
                }
            }
          }
        }
      } catch (e) {
        console.error("Critical Error (Silent):", e);
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not a page event');
  }
}

// --- HELPERS ---

async function handleReferral(sender_psid, refData) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;

    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');

    // 1. XỬ LÝ STATELESS QUOTE (Mới - V49)
    // Ref có dạng: Q_<Base64>
    if (refData && refData.startsWith('Q_')) {
        try {
            // Giải mã Base64 (đảo ngược quy trình URL Safe)
            const base64 = refData.substring(2).replace(/-/g, '+').replace(/_/g, '/');
            const decodedString = Buffer.from(base64, 'base64').toString('utf-8');
            const data = JSON.parse(decodedString);
            
            const imageUrl = data.i;
            const price = data.t;
            const fmtPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

            // Gửi ảnh trước
            if (imageUrl) {
                await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
            }

            // Gửi báo giá
            const msgBody = `💰 BÁO GIÁ AI ƯỚC TÍNH:\n--------------------\nTổng cộng: ${fmtPrice}\n--------------------\n⚠️ Lưu ý: Đây chỉ là giá tham khảo. Giá thực tế có thể thay đổi tùy tình trạng móng thật của bạn.\n\nNàng muốn đặt lịch làm mẫu này luôn không ạ?`;
            
            await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
                attachment: { type: "template", payload: { template_type: "button", text: msgBody, buttons: [{ type: "postback", title: "Chat Nhân Viên", payload: "CHAT_HUMAN" }] } }
            });
            return; // Xong, thoát luôn

        } catch (e) {
            console.error("Stateless Quote Error:", e);
            // Lỗi giải mã -> Gửi tin nhắn xin lỗi
            await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Dạ Ki đã nhận được ảnh nhưng bị lỗi hiển thị. Nàng gửi lại ảnh vào đây giúp Ki nha! ❤️" });
            return;
        }
    }

    // 2. XỬ LÝ MOCK / CŨ (Fallback)
    // Nếu ref không phải Q_ (ví dụ MOCK_ hoặc ID cũ), xử lý như cũ hoặc báo lỗi nhẹ
    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Chào nàng! Ki đã nhận được tín hiệu. Nàng chờ xíu nhân viên sẽ vào tư vấn trực tiếp nha! ❤️" });
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
