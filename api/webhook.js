
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V96_FIX_INTENT_CO_DAU
// TÍNH NĂNG: Im lặng tuyệt đối khi khách cần tư vấn mẫu riêng (CONSULTATION)
// FIX: Sửa lỗi nhận diện nhầm "đi ạ" thành ADDRESS

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
        console.log("[Airtable] Fetched Bot Config:", Object.keys(config));
        return config;

    } catch (e) {
        console.error("[Airtable] Fetch Config Error:", e);
        return null;
    }
}

// ============================================================
// 2. DỮ LIỆU DỰ PHÒNG & LOGIC TRẢ LỜI CỤ THỂ
// ============================================================
const FALLBACK_TEMPLATES = {
    PROMOTION: {
        text: "Dạ hiện tại Ki đang có ưu đãi giảm 10% cho khách đặt lịch trước nha.",
        image: null
    },
    // Intent cũ: PRICE (Vẫn giữ để fallback)
    PRICE: {
        text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!",
        image: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
    },
    // Intent mới: VIEW_MENU (Tương đương PRICE cũ)
    VIEW_MENU: {
        text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng cần tư vấn kỹ hơn thì nhắn Ki nhé!",
        image: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
    },
    // Intent: CONSULTATION (Tư vấn riêng)
    // Cập nhật: Đã XÓA cấu hình mặc định. 
    // Nếu AI nhận diện là CONSULTATION và không có trong Airtable -> Bot sẽ IM LẶNG.
    
    ADDRESS: {
        text: "Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A, Bình Tân ạ.",
        image: null
    }
};

// ============================================================
// 3. XỬ LÝ AI GEMINI (PHÂN LOẠI Ý ĐỊNH - NÂNG CẤP)
// ============================================================
async function classifyIntentWithGemini(userMessage) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "SILENCE"; 

    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt được nâng cấp để phân biệt VIEW_MENU và CONSULTATION
    // FIX: Thêm ràng buộc để tránh nhầm "đi ạ" thành Address
    const systemInstruction = `
    ROLE: You are the Receptionist AI for "Ki Nail Room".
    TASK: Classify the user's Vietnamese message into one of the following INTENTS.
    
    INTENT CATEGORIES:
    1. ADDRESS
       - Keywords: địa chỉ, ở đâu, khúc nào, map, đường, location.
       - NEGATIVE RULE: "đi ạ", "đi shop", "nha", "nhé" at the end of a sentence are polite particles, NOT address requests. "Cho mình xin..." is NOT address.

    2. VIEW_MENU (Asking for general price list)
       - User wants to see the menu/price list generally.
       - Keywords: "xin bảng giá", "menu", "giá sao shop", "price list", "rổ giá", "bảng giá", "xem giá".
       - Example: "Cho em xin bảng giá", "Có menu ko ạ".

    3. CONSULTATION (Asking for SPECIFIC design, photo, service or price)
       - User sends a photo, asks about a SPECIFIC set/design, or asks to SEE designs.
       - Keywords: "bộ này", "mẫu này", "làm như này", "tư vấn", "bao nhiêu tiền bộ này", "móng cô dâu", "wedding", "xin mẫu", "gửi mẫu", "có mẫu không".
       - Example: "Cho mình xin móng cô dâu", "Tư vấn giúp em giá bộ này", "Mình làm móng thật nha báo giá giúp".

    4. PROMOTION
       - Keywords: khuyến mãi, giảm giá, sale, discount, voucher, km, ctkm, kmai, phien mai.

    5. SILENCE
       - Greetings, booking requests, or small talk.

    OUTPUT: Return ONLY the intent name (ADDRESS, VIEW_MENU, CONSULTATION, PROMOTION, SILENCE).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1, 
                maxOutputTokens: 10,
            }
        });

        const intent = response.text ? response.text.trim().toUpperCase() : "SILENCE";
        
        // Clean up output just in case
        if (intent.includes('PROMOTION')) return 'PROMOTION';
        if (intent.includes('VIEW_MENU')) return 'VIEW_MENU';
        if (intent.includes('CONSULTATION')) return 'CONSULTATION';
        if (intent.includes('ADDRESS')) return 'ADDRESS';
        if (intent.includes('PRICE')) return 'VIEW_MENU'; // Map old PRICE to VIEW_MENU
        
        return "SILENCE";
    } catch (error) {
        return "SILENCE";
    }
}

// ============================================================
// 4. XỬ LÝ TỪ KHÓA (FALLBACK & SAFETY NET)
// ============================================================
function classifyIntentWithKeywords(text) {
    const t = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const rawT = text.toLowerCase();

    // 1. PROMOTION
    if (
        rawT.includes('km') || rawT.includes('ctkm') || 
        t.includes('sale') || t.includes('uu dai') || 
        t.includes('giam gia') || t.includes('khuyen mai') || t.includes('kmai')
    ) return 'PROMOTION';
    
    // 2. CONSULTATION (Ưu tiên bắt các từ chỉ định cụ thể trước)
    // CẬP NHẬT: Thêm 'co dau', 'xin mau', 'wedding' để bắt dính móng cô dâu
    if (
        t.includes('bo nay') || t.includes('mau nay') || t.includes('hinh nay') || 
        t.includes('nhu nay') || t.includes('tu van') || t.includes('lam mong that') ||
        t.includes('co dau') || t.includes('wedding') || t.includes('xin mau')
    ) return 'CONSULTATION';

    // 3. VIEW_MENU (Hỏi giá chung)
    if (
        t.includes('gia') || t.includes('menu') || t.includes('tien') || t.includes('bang gia')
    ) return 'VIEW_MENU';
    
    // 4. ADDRESS
    // Cẩn thận với từ 'duong' (đường) nếu nó nằm trong ngữ cảnh khác.
    if (t.includes('dia chi') || t.includes('o dau') || t.includes('map') || (t.includes('duong') && t.includes('nao'))) return 'ADDRESS';
    if (t.includes('dia chi') || t.includes('location')) return 'ADDRESS';
    
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

                // 1. XỬ LÝ REFERRAL
                let refParam = webhook_event.referral?.ref || webhook_event.postback?.referral?.ref || webhook_event.optin?.ref;
                if (refParam) {
                    await handleReferral(sender_psid, refParam); 
                    continue; 
                } 

                // 2. XỬ LÝ POSTBACK
                if (webhook_event.postback) {
                    const payload = webhook_event.postback.payload;
                    if (payload === 'CHAT_HUMAN') {
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                            text: "Dạ Ki đây ạ! Nàng nhắn tin ở đây nha, xíu Ki check xong Ki rep liền nè! 🥰" 
                        });
                    } else {
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
                    
                    // --- BƯỚC 1: Phân loại ý định ---
                    let intent = await classifyIntentWithGemini(userMessage);

                    // --- BƯỚC 2: Fallback bằng Keywords ---
                    if (intent === 'SILENCE') {
                        const fallbackIntent = classifyIntentWithKeywords(userMessage);
                        if (fallbackIntent !== 'SILENCE') {
                            intent = fallbackIntent;
                        }
                    }

                    // --- BƯỚC 3: Chọn câu trả lời ---
                    let responseData = null;

                    // ƯU TIÊN 1: Kiểm tra trong Airtable (Cho phép chủ shop override câu trả lời)
                    // Lưu ý: Mapping PRICE cũ sang VIEW_MENU để tương thích ngược
                    let lookupKey = intent;
                    if (lookupKey === 'VIEW_MENU' && !airtableConfig['VIEW_MENU'] && airtableConfig['PRICE']) {
                        lookupKey = 'PRICE';
                    }

                    if (airtableConfig && airtableConfig[lookupKey]) {
                        responseData = airtableConfig[lookupKey];
                    } else {
                        // ƯU TIÊN 2: Dùng mẫu có sẵn trong code
                        if (intent !== 'SILENCE') {
                            responseData = FALLBACK_TEMPLATES[intent];
                            
                            // Fallback cho VIEW_MENU nếu chưa có trong template
                            if (!responseData && intent === 'VIEW_MENU') responseData = FALLBACK_TEMPLATES['PRICE'];
                        }
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
