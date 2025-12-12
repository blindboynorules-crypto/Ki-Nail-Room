
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V90_AIRTABLE_BRAIN
// TÍNH NĂNG: Đọc kịch bản Chat từ Airtable (Dynamic Knowledge Base)

// ============================================================
// 1. HÀM LẤY DỮ LIỆU TỪ AIRTABLE (BỘ NÃO)
// ============================================================
// Cache đơn giản để tránh gọi Airtable quá nhiều (Lưu trong 1 phút)
let _botConfigCache = null;
let _lastFetchTime = 0;

async function getBotConfigFromAirtable() {
    const NOW = Date.now();
    // Nếu có cache và chưa quá 60 giây thì dùng lại
    if (_botConfigCache && (NOW - _lastFetchTime < 60000)) {
        return _botConfigCache;
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = 'BotConfig'; // Tên bảng cấu hình

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
        console.warn("Chưa cấu hình Airtable cho Bot.");
        return null;
    }

    try {
        // Lấy dữ liệu từ bảng BotConfig
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?maxRecords=50&view=Grid%20view`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        const data = await response.json();
        
        if (!data.records) return null;

        // Chuyển đổi sang định dạng dễ dùng: { "KEYWORD": { text: "...", image: "..." } }
        const config = {};
        data.records.forEach(record => {
            const fields = record.fields;
            // Key là từ khóa (VD: PRICE, ADDRESS, PROMOTION) - Viết hoa để khớp
            const key = fields.Keyword ? fields.Keyword.trim().toUpperCase() : null;
            
            if (key) {
                // Lấy URL ảnh đầu tiên nếu có attachment
                let imageUrl = null;
                if (fields.Image && Array.isArray(fields.Image) && fields.Image.length > 0) {
                    imageUrl = fields.Image[0].url;
                } else if (fields.ImageUrl) {
                    imageUrl = fields.ImageUrl; // Fallback nếu nhập link trực tiếp
                }

                config[key] = {
                    text: fields.Answer || "Dạ Ki đang cập nhật thông tin này ạ.",
                    image: imageUrl
                };
            }
        });

        _botConfigCache = config;
        _lastFetchTime = NOW;
        console.log("[Airtable] Fetched Bot Config:", Object.keys(config));
        return config;

    } catch (e) {
        console.error("[Airtable] Fetch Config Error:", e);
        return null;
    }
}

// ============================================================
// 2. DỮ LIỆU DỰ PHÒNG (FALLBACK KHI AIRTABLE LỖI)
// ============================================================
const FALLBACK_TEMPLATES = {
    PROMOTION: {
        text: "Dạ hiện tại Ki đang có ưu đãi giảm 10% cho khách đặt lịch trước nha.",
        image: null
    },
    PRICE: {
        text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!",
        image: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
    },
    ADDRESS: {
        text: "Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A, Bình Tân ạ.",
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
    
    // Prompt này hướng dẫn AI phân loại câu hỏi của khách
    const systemInstruction = `
    You are the Intent Classifier for Ki Nail Room's chatbot.
    Categorize user message into:
    1. ADDRESS: Location, map, where is shop.
    2. PRICE: Menu, price list, cost.
    3. PROMOTION: Discount, sale, offers.
    4. SILENCE: Anything else (Booking, specific questions, small talk).
    
    Output ONLY the category name.
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
        return classifyIntentWithKeywords(userMessage);
    }
}

// ============================================================
// 4. XỬ LÝ TỪ KHÓA (FALLBACK)
// ============================================================
function classifyIntentWithKeywords(text) {
    const t = text.toLowerCase();
    if (t.includes('khuyen mai') || t.includes('giam gia') || t.includes('uu dai') || t.includes('km')) return 'PROMOTION';
    if ((t.includes('gia') || t.includes('menu') || t.includes('tien')) && !t.includes('giam')) return 'PRICE';
    if (t.includes('dia chi') || t.includes('o dau') || t.includes('map') || t.includes('duong')) return 'ADDRESS';
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
        // --- PRE-FETCH DATA TỪ AIRTABLE ---
        const airtableConfig = await getBotConfigFromAirtable();

        for (const entry of body.entry) {
          if (entry.messaging) {
            for (const webhook_event of entry.messaging) {
                const sender_psid = webhook_event.sender.id;

                // 1. XỬ LÝ REFERRAL (Báo giá từ Web)
                let refParam = webhook_event.referral?.ref || webhook_event.postback?.referral?.ref || webhook_event.optin?.ref;
                if (refParam) {
                    await handleReferral(sender_psid, refParam); 
                    continue; 
                } 

                // 2. XỬ LÝ POSTBACK (Nút bấm)
                if (webhook_event.postback) {
                    const payload = webhook_event.postback.payload;
                    if (payload === 'CHAT_HUMAN') {
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                            text: "Dạ Ki đây ạ! Nàng nhắn tin ở đây nha, xíu Ki check xong Ki rep liền nè! 🥰" 
                        });
                    } else {
                        // Nút Get Started
                        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                            text: "Chào nàng xinh đẹp! 💕 Ki Nail Room rất vui được gặp nàng.\n\nNàng có thể gửi ảnh móng để Ki báo giá, hoặc hỏi địa chỉ/menu nha!" 
                        });
                        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
                    }
                    continue; 
                }

                // 3. XỬ LÝ TIN NHẮN (TEXT)
                if (webhook_event.message && webhook_event.message.text) {
                    const userMessage = webhook_event.message.text.trim();
                    
                    // Cơ chế AI Hybrid phân loại ý định
                    let intent = 'SILENCE';
                    try {
                        intent = await classifyIntentWithGemini(userMessage);
                    } catch (e) {
                        intent = classifyIntentWithKeywords(userMessage);
                    }

                    // Lấy câu trả lời: Ưu tiên Airtable -> Sau đó đến Fallback cứng
                    let responseData = null;
                    if (airtableConfig && airtableConfig[intent]) {
                        responseData = airtableConfig[intent];
                    } else {
                        responseData = FALLBACK_TEMPLATES[intent];
                    }

                    if (responseData) {
                        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
                        // Gửi Text trước
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: responseData.text });
                        // Gửi Ảnh sau (nếu có)
                        if (responseData.image) {
                            // Delay nhẹ để tin nhắn không bị ngược
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

// --- AIRTABLE HELPERS ---
async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;

    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
        text: "🎉 Ki đã nhận được yêu cầu báo giá! Nàng đợi xíu Ki tải chi tiết cho nha... 💅✨" 
    });

    if (recordId.startsWith('MOCK_')) {
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "⚠️ Đơn hàng thử nghiệm (Mock Mode)." });
        return;
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = 'Quotes';

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Lỗi hệ thống: Chưa cấu hình Database." });
        return;
    }

    try {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        const record = await response.json();
        const fields = record.fields;
        
        const imageUrl = fields["Image URL"];
        const itemsJson = fields["Items Detail"];
        const total = fields["Total Estimate"];

        if (imageUrl) {
            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        }

        let menuText = "🧾 CHI TIẾT BÁO GIÁ AI:\n\n";
        try {
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) {
                const groupedItems = {};
                items.forEach(item => {
                    const key = item.item.trim().toLowerCase();
                    if (!groupedItems[key]) {
                        groupedItems[key] = { name: item.item.trim(), cost: 0, count: 0 };
                    }
                    groupedItems[key].cost += item.cost;
                    groupedItems[key].count += 1;
                });
                Object.values(groupedItems).forEach(data => {
                    const costFmt = new Intl.NumberFormat('vi-VN').format(data.cost);
                    menuText += data.count > 1 
                        ? `▪️ ${data.name} (x${data.count}): ${costFmt}đ\n`
                        : `▪️ ${data.name}: ${costFmt}đ\n`;
                });
            }
        } catch (e) {
            menuText += "(Chi tiết đang cập nhật)\n";
        }

        const totalFmt = new Intl.NumberFormat('vi-VN').format(total || 0);
        menuText += `\n--------------------\n💰 TỔNG CỘNG: ${totalFmt}đ\n--------------------\n`;
        menuText += `Giá này do AI của Ki Nail gửi trước cho mình để tham khảo thôi nhen.`;

        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: menuText });
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
             attachment: { 
                 type: "template", 
                 payload: { 
                     template_type: "button", 
                     text: "Để xem thông tin chi tiết, nàng bấm vào nút bên dưới. Ki Nail sẽ tư vấn cụ thể và giải đáp cho mình ạ.", 
                     buttons: [{ type: "postback", title: "Chat Với Nhân Viên", payload: "CHAT_HUMAN" }] 
                 } 
             }
        });

    } catch (e) {
        console.error("Airtable Error:", e);
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Hic, Ki chưa tìm thấy đơn hàng. Nàng vui lòng gửi lại ảnh vào đây giúp Ki nha! ❤️" });
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
