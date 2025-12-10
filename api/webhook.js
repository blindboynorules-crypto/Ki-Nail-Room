
import { GoogleGenAI } from "@google/genai";

// api/webhook.js
// VERSION: V58_EVENT_LOOP_FIX
// CHẾ ĐỘ: AIRTABLE STATEFUL - Ưu tiên phản hồi Referral ngay lập tức

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
        return classifyIntentWithKeywords(userMessage);
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
        // Iterate over EACH entry (Facebook can batch them)
        for (const entry of body.entry) {
          // Iterate over EACH messaging event (Important fix for missing referrals)
          if (entry.messaging) {
            for (const webhook_event of entry.messaging) {
                const sender_psid = webhook_event.sender.id;

                // --- 1. XỬ LÝ REFERRAL (Ưu tiên số 1) ---
                let refParam = null;
                if (webhook_event.referral) {
                    refParam = webhook_event.referral.ref;
                } else if (webhook_event.postback && webhook_event.postback.referral) {
                    refParam = webhook_event.postback.referral.ref;
                } else if (webhook_event.optin && webhook_event.optin.ref) {
                    refParam = webhook_event.optin.ref;
                }

                if (refParam) {
                    console.log(`[Webhook] Handling Referral: ${refParam}`);
                    // Gọi hàm xử lý và chờ (không await để tránh block loop, nhưng logic bên trong phải gửi tin ngay)
                    handleReferral(sender_psid, refParam); 
                    continue; // Xử lý xong referral thì bỏ qua phần text bên dưới
                } 

                // --- 2. XỬ LÝ TIN NHẮN THƯỜNG ---
                if (webhook_event.message && webhook_event.message.text) {
                    const userMessage = webhook_event.message.text.trim();
                    
                    if (userMessage.toLowerCase() === 'ping') {
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: `PONG! V58 LoopFix.\nToken: ${FB_PAGE_ACCESS_TOKEN ? 'OK' : 'MISSING'}` });
                        continue;
                    }

                    // Cơ chế AI Hybrid
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
                            // Delay nhẹ để text đi trước ảnh
                            await new Promise(r => setTimeout(r, 300));
                            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, template.image);
                        }
                        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
                    }
                    // Nếu intent là SILENCE thì KHÔNG LÀM GÌ CẢ (Đúng luật)
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

// --- AIRTABLE HELPERS & PRIORITY HANDLING ---

async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;

    // PHẢN HỒI NGAY LẬP TỨC (QUAN TRỌNG)
    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
        text: "🎉 Ki đã nhận được yêu cầu báo giá! Nàng đợi xíu Ki tải chi tiết cho nha... 💅✨" 
    });

    if (recordId.startsWith('MOCK_')) {
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "⚠️ Đơn hàng thử nghiệm. Vui lòng thử lại trên web chính thức nha!" });
        return;
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = 'Quotes';

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
        // Vẫn báo lỗi nhẹ nhàng để khách biết
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Hệ thống đang bảo trì một chút, nàng nhắn tin trực tiếp để nhân viên tư vấn nha!" });
        return;
    }

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
                throw new Error('Airtable Fetch Failed');
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

        if (imageUrl) {
            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        }

        let menuText = "🧾 CHI TIẾT BÁO GIÁ AI:\n";
        try {
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const cost = new Intl.NumberFormat('vi-VN').format(item.cost);
                    menuText += `- ${item.item}: ${cost}đ\n`;
                });
            }
        } catch (e) {
            menuText += "(Chi tiết đang cập nhật)\n";
        }

        const totalFmt = new Intl.NumberFormat('vi-VN').format(total || 0);
        menuText += `--------------------\n💰 TỔNG CỘNG: ${totalFmt}đ\n--------------------\n⚠️ Giá tham khảo từ AI. Nàng muốn đặt lịch làm luôn không ạ?`;

        // Gửi nội dung text cuối cùng
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
             attachment: { type: "template", payload: { template_type: "button", text: menuText, buttons: [{ type: "postback", title: "Chat Với Nhân Viên", payload: "CHAT_HUMAN" }] } }
        });

    } catch (e) {
        console.error("Airtable Error:", e);
        // Fallback cuối cùng nếu không lấy được dữ liệu
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "Hic, mạng đang hơi lag nên Ki chưa tải được chi tiết. Nàng gửi lại ảnh vào đây giúp Ki nha! ❤️" });
    }
}

async function sendSenderAction(token, psid, action) {
    try { await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, sender_action: action }) }); } catch (e) {}
}

async function sendFacebookMessage(token, psid, messageContent) {
    try { 
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipient: { id: psid }, message: messageContent }) }); 
    } catch (e) { console.error("Fetch Error:", e); }
}

async function sendFacebookImage(token, psid, imageUrl) {
     await sendFacebookMessage(token, psid, { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } });
}
