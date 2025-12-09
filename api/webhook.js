
import { GoogleGenAI } from "@google/genai";

// ============================================================
// 🔒 DỮ LIỆU TRẢ LỜI CỐ ĐỊNH (KHÔNG CHO AI TỰ BỊA)
// ============================================================
const FIXED_ANSWERS = {
    ADDRESS: {
        text: "Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A ( cũ ), Bình Tân ạ.\n\nNàng bấm vào link này để xem bản đồ chỉ đường cho tiện nha:\nhttps://maps.app.goo.gl/3z3iii6wd37JeJVp7?g_st=ipc",
        imageUrl: null
    },
    PRICE: {
        text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!",
        imageUrl: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
    },
    PROMOTION: {
        text: "Dạ Ki gởi mình chương trình khuyến mãi HOT hiện tại nha. Nàng xem qua kẻo lỡ ưu đãi xịn nè!",
        imageUrl: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207799/Noel2025_rxuc1y.jpg"
    }
};

// ============================================================
// 🧠 HÀM PHÂN TÍCH Ý ĐỊNH BẰNG AI (GEMINI)
// ============================================================
async function classifyIntentWithGemini(userMessage) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("FATAL ERROR: Thiếu API_KEY của Google Gemini trong Vercel Settings.");
        return "ERROR_MISSING_KEY"; 
    }

    const ai = new GoogleGenAI({ apiKey });

    // PROMPT NGHIÊM NGẶT - CHỈ ĐẠO HÀNH VI CỦA BOT
    const prompt = `
    Bạn là bộ lọc tin nhắn cho tiệm Nail "Ki Nail Room".
    Nhiệm vụ: Phân tích tin nhắn của khách và chỉ được phép chọn 1 trong 4 hành động dưới đây.

    *** CÁC LOẠI CÂU HỎI ĐƯỢC PHÉP TRẢ LỜI:
    1. "ADDRESS": Khách hỏi địa chỉ, ở đâu, đường đi, bản đồ, chỗ nào.
    2. "PRICE": Khách hỏi bảng giá chung, menu, bao nhiêu tiền (chung chung), giá dịch vụ.
    3. "PROMOTION": Khách hỏi khuyến mãi, ưu đãi, giảm giá, combo.

    *** CÁC TRƯỜNG HỢP PHẢI IM LẶNG ("SILENCE"):
    - Khách hỏi đặt lịch (Ví dụ: "2 người được không", "còn chỗ không", "book lịch", "mấy giờ làm được").
    - Khách hỏi giá của MỘT MẪU CỤ THỂ (Ví dụ: "bộ này bao nhiêu", "mẫu này giá sao", gửi kèm ảnh).
    - Khách hỏi giờ mở cửa/đóng cửa.
    - Khách tâm sự, khen chê, chào hỏi, hoặc nói bất cứ điều gì khác.
    - Tin nhắn không rõ ràng.

    *** QUY TẮC QUAN TRỌNG:
    - Bỏ qua các từ đệm cảm thán như: "ơi", "ạ", "dạ", "shop ơi", "ad ơi", "thế", "nào".
    - Ví dụ: "Shop ơi địa chỉ ở đâu thế ạ" => Phải hiểu là hỏi "ADDRESS".
    - Ví dụ: "Ki Nail ơi giá sao" => Phải hiểu là hỏi "PRICE".

    *** VÍ DỤ HUẤN LUYỆN (FEW-SHOT):
    - Khách: "Shop ở đâu dạ" -> Output: ADDRESS
    - Khách: "Cho xin cái menu" -> Output: PRICE
    - Khách: "Đang có km gì ko" -> Output: PROMOTION
    - Khách: "2ng đc hông Ki ui" -> Output: SILENCE (Vì đây là đặt lịch, chữ 'đc' là được, không phải địa chỉ)
    - Khách: "Em xin giá bộ này" -> Output: SILENCE (Vì hỏi giá mẫu cụ thể)
    - Khách: "Ki Nail ơi địa chỉ mình ở đâu thía ạ" -> Output: ADDRESS
    - Khách: "Alo" -> Output: SILENCE

    Tin nhắn của khách: "${userMessage}"
    
    Chỉ trả về đúng 1 từ duy nhất: ADDRESS, PRICE, PROMOTION hoặc SILENCE. Không giải thích gì thêm.
    `;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
            config: {
                temperature: 0, // Nhiệt độ 0 để AI trả lời chính xác như máy, không sáng tạo
                maxOutputTokens: 10,
            }
        });
        
        let intent = result.text.trim().toUpperCase();
        
        // Safety check: Đảm bảo AI chỉ trả về các từ khóa cho phép
        if (intent.includes("ADDRESS")) return "ADDRESS";
        if (intent.includes("PRICE")) return "PRICE";
        if (intent.includes("PROMOTION")) return "PROMOTION";
        
        return "SILENCE";

    } catch (error) {
        console.error("Gemini AI Error:", error);
        return "ERROR_AI"; // Báo lỗi AI cụ thể
    }
}

export default async function handler(req, res) {
  // FORCE V21 UPDATE LOG
  console.log("[BOT V21] Webhook handler loaded.");

  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
  // 1. XÁC MINH WEBHOOK (Facebook Ping)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log("[WEBHOOK VERIFY REQUEST]", { mode, token, challenge });

    if (mode && token) {
      if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
        console.log("WEBHOOK VERIFIED SUCCESS");
        return res.status(200).send(challenge);
      } else {
        console.error("WEBHOOK VERIFICATION FAILED: Token mismatch");
        return res.status(403).send('Verification failed');
      }
    }
  }

  // 2. XỬ LÝ TIN NHẮN ĐẾN (POST)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      try {
        for (const entry of body.entry) {
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;

            // --- TRƯỜNG HỢP 1: CÓ REF (TỪ WEB BÁO GIÁ AI CHUYỂN SANG) ---
            let refParam = null;
            if (webhook_event.referral) refParam = webhook_event.referral.ref;
            else if (webhook_event.postback?.referral) refParam = webhook_event.postback.referral.ref;
            else if (webhook_event.optin?.ref) refParam = webhook_event.optin.ref;

            if (refParam) {
                await handleReferral(sender_psid, refParam);
            } 
            // --- TRƯỜNG HỢP 2: KHÁCH NHẮN TIN CHỮ (TEXT) ---
            else if (webhook_event.message && webhook_event.message.text) {
                const userMessage = webhook_event.message.text.trim();
                console.log(`[USER MESSAGE]: ${userMessage}`);
                
                // === CHẨN ĐOÁN HỆ THỐNG (DIAGNOSTIC PING) ===
                if (userMessage.toLowerCase() === 'ping') {
                    const statusMsg = `PONG! Hệ thống Ki Nail Room [V21] đang hoạt động.\n- FB Token: ${FB_PAGE_ACCESS_TOKEN ? 'OK' : 'MISSING'}\n- AI Key: ${process.env.API_KEY ? 'OK' : 'MISSING'}`;
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: statusMsg });
                    return res.status(200).send('EVENT_RECEIVED');
                }

                // GỌI AI ĐỂ PHÂN TÍCH Ý ĐỊNH
                const intent = await classifyIntentWithGemini(userMessage);
                console.log(`[INTENT RESULT]: ${intent}`);

                if (intent === "ERROR_MISSING_KEY") {
                     await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                        text: "⚠️ LỖI HỆ THỐNG: Bot chưa có API Key của Google Gemini. Vui lòng liên hệ Admin để thêm API_KEY vào Vercel." 
                    });
                } else if (intent === "ERROR_AI") {
                     await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                        text: "⚠️ LỖI AI: Hệ thống AI đang gặp sự cố kết nối. Vui lòng thử lại sau." 
                    });
                } else if (intent !== "SILENCE" && FIXED_ANSWERS[intent]) {
                    // Nếu AI bảo trả lời -> Lấy nội dung cố định gửi đi
                    const answerData = FIXED_ANSWERS[intent];

                    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
                    await new Promise(r => setTimeout(r, 1000)); // Delay nhẹ cho tự nhiên
                    
                    // Gửi Text
                    if (answerData.text) {
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: answerData.text });
                    }
                    // Gửi Ảnh (nếu có)
                    if (answerData.imageUrl) {
                        await new Promise(r => setTimeout(r, 500));
                        await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, answerData.imageUrl);
                    }
                    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
                } else {
                    // Nếu AI bảo SILENCE -> Không làm gì cả
                    console.log(`[BOT] Silenced by AI rule.`);
                }
            }
          }
        }
      } catch (e) {
        console.error("Webhook processing error:", e);
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not a page event');
  }
}

// --- GIỮ NGUYÊN CÁC HÀM HỖ TRỢ CŨ (KHÔNG ĐỔI) ---
async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;

    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');

    if (recordId && recordId.startsWith('MOCK_')) {
        await new Promise(r => setTimeout(r, 1000));
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "🚧 Đang hiển thị dữ liệu DEMO:" });
        await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, "https://drive.google.com/thumbnail?id=1XSy0IKZ_D_bUcfHrmADzfctEuIkeCWIM&sz=w1000");
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Móng Úp + Vẽ: 130.000đ\n(Đây là tin nhắn mẫu)",
                    buttons: [{ type: "postback", title: "Liên Hệ KiNailRoom", payload: "CHAT_HUMAN" }]
                }
            }
        });
        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
        return;
    }

    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) return;

    try {
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        if (!airtableRes.ok) return;

        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total, "Items Detail": itemsJson } = record.fields;

        const fmt = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        const totalFormatted = fmt(total);

        let detailsText = "";
        try {
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) {
                items.forEach(i => {
                     detailsText += `- ${i.item}: ${fmt(i.cost)}\n`;
                });
            }
        } catch (e) {}

        if (imageUrl) await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        await new Promise(r => setTimeout(r, 500));

        const msgBody = `CHI TIẾT BÁO GIÁ:\n${detailsText}\nTỔNG CỘNG: ${totalFormatted}\n\nĐây là giá được phân tích và báo giá bằng AI, để biết giá cụ thể bạn cứ liên hệ trực tiếp Ki Nail hén.\n\nChat với tụi mình để chốt lịch nhé!`;
        
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: msgBody.substring(0, 640), 
                    buttons: [{ type: "postback", title: "Liên Hệ KiNailRoom", payload: "CHAT_HUMAN" }]
                }
            }
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
    }
}

async function sendSenderAction(token, psid, action) {
    try {
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: { id: psid }, sender_action: action })
        });
    } catch (e) {}
}

async function sendFacebookMessage(token, psid, messageContent) {
    try {
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: { id: psid }, message: messageContent })
        });
    } catch (e) { console.error(e); }
}

async function sendFacebookImage(token, psid, imageUrl) {
     await sendFacebookMessage(token, psid, {
        attachment: {
            type: "image",
            payload: { url: imageUrl, is_reusable: true }
        }
    });
}
