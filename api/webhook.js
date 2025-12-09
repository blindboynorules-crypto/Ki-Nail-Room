
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// CHẾ ĐỘ: AIRTABLE STATEFUL (V55) - Lấy dữ liệu từ Database
// CHATBOT: GEMINI 2.5 FLASH (Kỷ luật thép)

// ============================================================
// 1. DỮ LIỆU CÂU TRẢ LỜI MẪU
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
// 2. XỬ LÝ AI GEMINI (PHÂN LOẠI)
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
       - IMPORTANT: If user asks about FUTURE promotions (sắp tới), STILL CLASSIFY AS PROMOTION.
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
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: `PONG! V55 Airtable Restored.\nToken: ${FB_PAGE_ACCESS_TOKEN ? 'OK' : 'MISSING'}` });
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

// --- AIRTABLE HELPERS ---

async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;

    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');

    // MOCK ID (Trường hợp chưa cấu hình DB mà vẫn bấm gửi)
    if (recordId.startsWith('MOCK_')) {
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Chào nàng! Ki đã nhận được yêu cầu. Nàng chờ xíu nhân viên sẽ vào tư vấn trực tiếp nha! ❤️" });
        return;
    }

    // AIRTABLE FETCH
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = 'Quotes';

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
        // Fallback nếu quên cấu hình Key
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Hệ thống đang bảo trì dữ liệu. Nhân viên sẽ hỗ trợ nàng ngay ạ!" });
        return;
    }

    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });

        if (!response.ok) throw new Error('Airtable Fetch Failed');

        const record = await response.json();
        const fields = record.fields;
        
        const imageUrl = fields["Image URL"];
        const itemsJson = fields["Items Detail"];
        const total = fields["Total Estimate"];

        // 1. Gửi Ảnh trước
        if (imageUrl) {
            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        }

        // 2. Tạo nội dung MENU chi tiết từ JSON
        let menuText = "🧾 CHI TIẾT BÁO GIÁ:\n";
        try {
            const items = JSON.parse(itemsJson);
            items.forEach(item => {
                const cost = new Intl.NumberFormat('vi-VN').format(item.cost);
                menuText += `- ${item.item}: ${cost}đ\n`;
            });
        } catch (e) {
            menuText += "(Chi tiết đang cập nhật)\n";
        }

        const totalFmt = new Intl.NumberFormat('vi-VN').format(total);
        menuText += `--------------------\n💰 TỔNG CỘNG: ${totalFmt}đ\n--------------------\n⚠️ Giá tham khảo, có thể thay đổi tùy thực tế. Nàng muốn đặt lịch luôn không ạ?`;

        // 3. Gửi Text báo giá
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
             attachment: { type: "template", payload: { template_type: "button", text: menuText, buttons: [{ type: "postback", title: "Chat Nhân Viên", payload: "CHAT_HUMAN" }] } }
        });

    } catch (e) {
        console.error("Airtable Logic Error:", e);
        // Fallback an toàn
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Dạ Ki đã nhận được ảnh. Nàng chờ xíu Ki báo giá chi tiết nha! ❤️" });
    }
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
