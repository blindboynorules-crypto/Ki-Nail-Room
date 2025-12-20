
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V101_ADMIN_PING_UPGRADE
// TÍNH NĂNG: Thêm mã PING KINAIL cho Admin kiểm tra hệ thống

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
        return null;
    }

    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?maxRecords=50`, {
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
        return null;
    }
}

// ============================================================
// 2. DỮ LIỆU DỰ PHÒNG & ADMIN COMMANDS
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
    },
    ADMIN_PING: {
        text: "PONG! 🤖\n\nHệ thống Ki Nail Room đã được nâng cấp thành công:\n✅ Model: Gemini 3 Flash (Fast & Smart)\n✅ Thinking: Đã kích hoạt (Báo giá chuẩn xác)\n✅ Database: Đã kết nối Airtable\n✅ Status: Sẵn sàng phục vụ khách nhen nàng! 🥰💅",
        image: null
    }
};

// ============================================================
// 3. XỬ LÝ AI GEMINI (PHÂN LOẠI Ý ĐỊNH)
// ============================================================
async function classifyIntentWithGemini(userMessage) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "SILENCE"; 

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `
    ROLE: Receptionist AI for "Ki Nail Room".
    INTENTS: ADDRESS, VIEW_MENU, CONSULTATION, PROMOTION, SILENCE.
    RULES: Return ONLY the intent name. If the user mentions "PING KINAIL", return SILENCE (keyword handler will take over).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMessage,
            config: { systemInstruction, temperature: 0.1, maxOutputTokens: 10 }
        });
        return response.text ? response.text.trim().toUpperCase() : "SILENCE";
    } catch (error) {
        return "SILENCE";
    }
}

// ============================================================
// 4. XỬ LÝ TỪ KHÓA (SAFETY NET & ADMIN COMMANDS)
// ============================================================
function classifyIntentWithKeywords(text) {
    const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Admin Command Check (Ưu tiên số 1)
    if (t.includes('ping kinail')) return 'ADMIN_PING';

    if (t.includes('bao lau') || t.includes('may tieng')) return 'SILENCE';
    if (t.includes('km') || t.includes('ctkm') || t.includes('giam gia')) return 'PROMOTION';
    if (t.includes('bo nay') || t.includes('mau nay') || t.includes('co dau')) return 'CONSULTATION';

    const hasPriceKeyword = /\b(gia|menu|bang gia|tien)\b/.test(t);
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
    if (mode && token === FB_VERIFY_TOKEN) return res.status(200).send(challenge);
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
                    
                    // Kiểm tra từ khóa trước (cho Admin command)
                    let intent = classifyIntentWithKeywords(userMessage);
                    
                    // Nếu từ khóa không bắt được (SILENCE), mới dùng AI
                    if (intent === 'SILENCE') {
                        intent = await classifyIntentWithGemini(userMessage);
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
                            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, responseData.image);
                        }
                    }
                }
            }
          }
        }
      } catch (e) {}
      return res.status(200).send('EVENT_RECEIVED');
    }
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
