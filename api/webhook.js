
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V100_GEMINI_3_FLASH_UPGRADE
// TÍNH NĂNG: Im lặng tuyệt đối khi khách cần tư vấn mẫu riêng hoặc hỏi thời gian
// UPGRADE: Chuyển sang Gemini 3 Flash để phân loại ý định thông minh hơn

// ============================================================
// 1. HÀM LẤY DỮ LIỆU TỪ AIRTABLE (BỘ NÃO)
// ============================================================
let _botConfigCache = null;
let _lastFetchTime = 0;

async function getBotConfigFromAirtable() {
    const NOW = Date.now();
    if (_botConfigCache && (NOW - _lastFetchTime < 60000)) {
        return _botConfigCache;
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = 'BotConfig';

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
        console.warn("Chưa cấu hình Airtable cho Bot.");
        return null;
    }

    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?maxRecords=50&view=Grid%20view`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        const data = await response.json();
        if (!data.records) return null;

        const config = {};
        data.records.forEach(record => {
            const fields = record.fields;
            const key = fields.Keyword ? fields.Keyword.trim().toUpperCase() : null;
            
            if (key) {
                let imageUrl = null;
                if (fields.Attachments && Array.isArray(fields.Attachments) && fields.Attachments.length > 0) {
                    imageUrl = fields.Attachments[0].url;
                } else if (fields.Image && Array.isArray(fields.Image) && fields.Image.length > 0) {
                    imageUrl = fields.Image[0].url;
                } else if (fields.ImageUrl) {
                    imageUrl = fields.ImageUrl; 
                }

                config[key] = {
                    text: fields.Answer || "Dạ Ki đang cập nhật thông tin này ạ.",
                    image: imageUrl
                };
            }
        });

        _botConfigCache = config;
        _lastFetchTime = NOW;
        return config;

    } catch (e) {
        console.error("[Airtable] Fetch Config Error:", e);
        return null;
    }
}

// ============================================================
// 2. DỮ LIỆU DỰ PHÒNG
// ============================================================
const FALLBACK_TEMPLATES = {
    PROMOTION: {
        text: "Dạ hiện tại Ki đang có ưu đãi giảm 10% cho khách đặt lịch trước nha.",
        image: null
    },
    VIEW_MENU: {
        text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!",
        image: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
    },
    ADDRESS: {
        text: "Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A, Bình Tân ạ.",
        image: null
    }
};

// ============================================================
// 3. XỬ LÝ AI GEMINI (PHÂN LOẠI Ý ĐỊNH - UPGRADE GEMINI 3)
// ============================================================
async function classifyIntentWithGemini(userMessage) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "SILENCE"; 

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `
    ROLE: You are the Receptionist AI for "Ki Nail Room".
    TASK: Classify the user's message into one of the following INTENTS.
    
    INTENT CATEGORIES:
    1. ADDRESS: Location requests.
    2. VIEW_MENU: Asking for general price list/menu.
    3. CONSULTATION: Asking for specific designs, showing photos, or asking price for a specific set.
    4. PROMOTION: Asking for discounts/sales.
    5. DURATION: Asking how long a service takes (e.g., "mấy tiếng", "bao lâu").
    6. SILENCE: Greetings, booking, small talk or questions about duration.

    RULES FOR GEMINI 3:
    - "Cho mình xin mẫu cô dâu đi ạ" -> CONSULTATION (NOT ADDRESS).
    - "Làm trong bao lâu", "2 tiếng cho tay chân" -> DURATION/SILENCE (NOT VIEW_MENU/PRICE).
    - If unsure, always return SILENCE to let human staff handle it.

    OUTPUT: Return ONLY the intent name (ADDRESS, VIEW_MENU, CONSULTATION, PROMOTION, SILENCE).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMessage,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, 
                maxOutputTokens: 10,
            }
        });

        const intent = response.text ? response.text.trim().toUpperCase() : "SILENCE";
        
        if (intent.includes('PROMOTION')) return 'PROMOTION';
        if (intent.includes('VIEW_MENU')) return 'VIEW_MENU';
        if (intent.includes('CONSULTATION')) return 'CONSULTATION';
        if (intent.includes('ADDRESS')) return 'ADDRESS';
        if (intent.includes('DURATION')) return 'SILENCE'; 
        
        return "SILENCE";
    } catch (error) {
        return "SILENCE";
    }
}

// ============================================================
// 4. XỬ LÝ TỪ KHÓA (SAFETY NET)
// ============================================================
function classifyIntentWithKeywords(text) {
    const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const rawT = text.toLowerCase();

    if (t.includes('bao lau') || t.includes('may tieng') || t.includes('lam lau ko') || t.includes('may gio xong')) return 'SILENCE';
    if (rawT.includes('km') || rawT.includes('ctkm') || t.includes('sale') || t.includes('uu dai') || t.includes('giam gia')) return 'PROMOTION';
    if (t.includes('bo nay') || t.includes('mau nay') || t.includes('co dau') || t.includes('xin mau')) return 'CONSULTATION';

    const hasPriceKeyword = /\b(gia|menu|bang gia)\b/.test(t) || /\b(tien)\b/.test(t);
    if (hasPriceKeyword) return 'VIEW_MENU';
    if (t.includes('dia chi') || t.includes('o dau') || t.includes('map')) return 'ADDRESS';
    
    return 'SILENCE';
}

// ============================================================
// 5. MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token === FB_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    return res.status(403).send('Verification failed');
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'page') {
      try {
        const airtableConfig = await getBotConfigFromAirtable();
        for (const entry of body.entry) {
          if (entry.messaging) {
            for (const webhook_event of entry.messaging) {
                const sender_psid = webhook_event.sender.id;

                if (webhook_event.message && webhook_event.message.text) {
                    const userMessage = webhook_event.message.text.trim();
                    let intent = await classifyIntentWithGemini(userMessage);

                    if (intent === 'SILENCE') {
                        const fallbackIntent = classifyIntentWithKeywords(userMessage);
                        if (fallbackIntent !== 'SILENCE') intent = fallbackIntent;
                    }

                    let responseData = null;
                    if (airtableConfig && airtableConfig[intent]) {
                        responseData = airtableConfig[intent];
                    } else if (intent !== 'SILENCE') {
                        responseData = FALLBACK_TEMPLATES[intent];
                    }

                    if (responseData) {
                        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: responseData.text });
                        if (responseData.image) {
                            await new Promise(r => setTimeout(r, 500));
                            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, responseData.image);
                        }
                        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
                    }
                }
            }
          }
        }
      } catch (e) {
        console.error("Critical Webhook Error:", e);
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not a page event');
  }
}

async function sendSenderAction(token, psid, action) {
    try { await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, sender_action: action }) }); } catch (e) {}
}

async function sendFacebookMessage(token, psid, messageContent) {
    try { await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, message: messageContent }) }); } catch (e) {}
}

async function sendFacebookImage(token, psid, imageUrl) {
     await sendFacebookMessage(token, psid, { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } });
}
