
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V56_AIRTABLE_RETRY
// CHẾ ĐỘ: AIRTABLE STATEFUL - Lấy dữ liệu từ Database với cơ chế Retry

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
    
    // Prompt được tinh chỉnh để hiểu 'ctkm', 'sắp tới', và các câu hỏi phổ biến
    const systemInstruction = `
    You are the Intent Classifier for Ki Nail Room's chatbot.
    Your ONLY job is to categorize the user's message into one of these 4 categories.
    
    CATEGORIES:
    1. ADDRESS: User asks for location, map, address. (Keywords: địa chỉ, ở đâu, map, đường nào, tọa độ, add...)
    2. PRICE: User asks for the general menu, price list. (Keywords: bảng giá, menu, giá sao, bao nhiêu tiền, mắc không...)
    3. PROMOTION: User asks for discounts, sales, current offers. 
       - Keywords: khuyến mãi, giảm giá, ưu đãi, km, ctkm...
       - IMPORTANT: If user asks about FUTURE promotions (sắp tới), STILL CLASSIFY AS PROMOTION (Send current promo).
    4. SILENCE: User asks for ANYTHING ELSE (Booking, Specific Price 'giá bộ này', Chat, Complaints, Hello, Bye).

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
        // Fallback to keyword if AI fails
        return classifyIntentWithKeywords(userMessage);
    }
}

// ============================================================
// 3. XỬ LÝ TỪ KHÓA (FALLBACK)
// ============================================================
function classifyIntentWithKeywords(text) {
    const t = text.toLowerCase();
    // Ưu tiên Khuyến mãi (để bắt 'giảm giá' trước khi bắt 'giá')
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

            // Xử lý sự kiện Referral (Click link m.me)
            let refParam = null;
            if (webhook_event.referral) refParam = webhook_event.referral.ref;
            else if (webhook_event.postback?.referral) refParam = webhook_event.postback.referral.ref;
            else if (webhook_event.optin?.ref) refParam = webhook_event.optin.ref;

            if (refParam) {
                console.log(`[Webhook] Received Referral: ${refParam}`);
                await handleReferral(sender_psid, refParam);
            } 
            // Xử lý tin nhắn thường
            else if (webhook_event.message && webhook_event.message.text) {
                const userMessage = webhook_event.message.text.trim();
                
                // Lệnh PING để test kết nối
                if (userMessage.toLowerCase() === 'ping') {
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: `PONG! V56 Airtable Retry.\nToken Status: ${FB_PAGE_ACCESS_TOKEN ? 'OK' : 'MISSING'}` });
                    return res.status(200).send('EVENT_RECEIVED');
                }

                // AI Phân loại
                let intent = 'SILENCE';
                try {
                    intent = await classifyIntentWithGemini(userMessage);
                } catch (e) {
                    intent = classifyIntentWithKeywords(userMessage);
                }

                // Trả lời nếu khớp Intent
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
        console.error("Critical Webhook Error:", e);
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not a page event');
  }
}

// --- AIRTABLE HELPERS & RETRY LOGIC ---

async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) {
        console.error("Missing FB_PAGE_ACCESS_TOKEN in Webhook");
        return;
    }

    // 1. Phản hồi NGAY LẬP TỨC để khách biết Bot đang chạy
    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
    // await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Dạ Ki đang tải đơn báo giá của nàng, đợi xíu xiu nha..." });

    // MOCK ID Check
    if (recordId.startsWith('MOCK_')) {
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "⚠️ Đơn hàng thử nghiệm chưa được lưu. Vui lòng liên hệ trực tiếp để được hỗ trợ ạ!" });
        return;
    }

    // AIRTABLE FETCH with RETRY
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = 'Quotes';

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "⚠️ Lỗi hệ thống: Chưa cấu hình Database. Vui lòng báo Admin." });
        return;
    }

    // Hàm fetch có thử lại (Retry)
    const fetchAirtable = async (retries = 3, delay = 1000) => {
        try {
            const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${recordId}`, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
            });
            if (!response.ok) {
                if (retries > 0) {
                    await new Promise(r => setTimeout(r, delay));
                    return fetchAirtable(retries - 1, delay * 2);
                }
                throw new Error('Airtable Fetch Failed after retries');
            }
            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    try {
        const record = await fetchAirtable();
        const fields = record.fields;
        
        const imageUrl = fields["Image URL"];
        const itemsJson = fields["Items Detail"];
        const total = fields["Total Estimate"];

        // 2. Gửi Ảnh từ Airtable
        if (imageUrl) {
            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        } else {
             await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Ki không tìm thấy ảnh mẫu, nàng gửi lại giúp Ki nha!" });
        }

        // 3. Tạo nội dung MENU chi tiết
        let menuText = "🧾 CHI TIẾT BÁO GIÁ:\n";
        try {
            // Kiểm tra xem itemsJson có phải string không hay đã là object
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const cost = new Intl.NumberFormat('vi-VN').format(item.cost);
                    menuText += `- ${item.item}: ${cost}đ\n`;
                });
            } else {
                menuText += "(Chi tiết chưa cập nhật)\n";
            }
        } catch (e) {
            menuText += "(Đang cập nhật chi tiết)\n";
        }

        const totalFmt = new Intl.NumberFormat('vi-VN').format(total || 0);
        menuText += `--------------------\n💰 TỔNG CỘNG: ${totalFmt}đ\n--------------------\n⚠️ Giá tham khảo, có thể thay đổi tùy thực tế. Nàng muốn đặt lịch luôn không ạ?`;

        // 4. Gửi Text báo giá
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
             attachment: { type: "template", payload: { template_type: "button", text: menuText, buttons: [{ type: "postback", title: "Chat Nhân Viên", payload: "CHAT_HUMAN" }] } }
        });

    } catch (e) {
        console.error("Airtable Logic Error:", e);
        // Fallback cuối cùng nếu lỗi thật sự
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Dạ Ki đã nhận được yêu cầu nhưng mạng hơi chậm xíu. Nàng chờ nhân viên vào tư vấn trực tiếp nha! ❤️" });
    }
}

async function sendSenderAction(token, psid, action) {
    try { await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, sender_action: action }) }); } catch (e) {}
}

async function sendFacebookMessage(token, psid, messageContent) {
    try { 
        const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, message: messageContent }) }); 
        const data = await res.json();
        if (data.error) console.error("FB Send Error:", data.error);
    } catch (e) { console.error("Fetch Error:", e); }
}

async function sendFacebookImage(token, psid, imageUrl) {
     await sendFacebookMessage(token, psid, { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } });
}
