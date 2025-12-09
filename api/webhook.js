
// api/webhook.js
// CHATBOT: PHIÊN BẢN TỪ KHÓA (KEYWORD-BASED) - KHÔNG DÙNG AI
// Tốc độ nhanh, chính xác 100% theo kịch bản, không tốn quota AI.

// ============================================================
// 1. DỮ LIỆU HUẤN LUYỆN (TỪ KHÓA & CÂU TRẢ LỜI)
// ============================================================
const TRAINING_DATA = [
    {
        // MỤC 1: ĐỊA CHỈ
        // Từ khóa kích hoạt: địa chỉ, ở đâu, map, bản đồ, đường đi...
        keywords: ["địa chỉ", "ở đâu", "map", "bản đồ", "add", "tọa độ", "đường nào", "vị trí"],
        response: {
            text: "Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A ( cũ ), Bình Tân ạ.\n\nNàng bấm vào link này để xem bản đồ chỉ đường cho tiện nha:\nhttps://maps.app.goo.gl/3z3iii6wd37JeJVp7?g_st=ipc",
            imageUrl: null
        }
    },
    {
        // MỤC 2: BẢNG GIÁ / MENU
        // Từ khóa kích hoạt: giá, menu, tiền, nhiêu...
        keywords: ["giá", "menu", "nhiêu", "tiền", "bảng giá", "chi phí", "cost", "price"],
        response: {
            text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!",
            imageUrl: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
        }
    },
    {
        // MỤC 3: KHUYẾN MÃI
        // Từ khóa kích hoạt: khuyến mãi, ưu đãi, sale, km...
        keywords: ["khuyến mãi", "km", "sale", "ưu đãi", "giảm giá", "promotion", "combo"],
        response: {
            text: "Dạ Ki gởi mình chương trình khuyến mãi HOT hiện tại nha. Nàng xem qua kẻo lỡ ưu đãi xịn nè!",
            imageUrl: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207799/Noel2025_rxuc1y.jpg"
        }
    }
];

// ============================================================
// 2. HÀM XỬ LÝ LOGIC TÌM TỪ KHÓA
// ============================================================
function findKeywordResponse(userMessage) {
    // Chuyển tin nhắn về chữ thường để so sánh (ví dụ: "GIÁ" -> "giá")
    const lowerMsg = userMessage.toLowerCase().trim();

    // Duyệt qua từng kịch bản
    for (const data of TRAINING_DATA) {
        // Kiểm tra xem tin nhắn có chứa từ khóa nào trong danh sách không
        // Sử dụng .some() để tìm bất kỳ từ nào khớp
        const hasKeyword = data.keywords.some(keyword => lowerMsg.includes(keyword));
        
        if (hasKeyword) {
            return data.response; // Tìm thấy thì trả về câu trả lời ngay
        }
    }

    // Nếu không khớp từ khóa nào -> Trả về null (Để Bot im lặng)
    return null;
}

// ============================================================
// 3. MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  console.log("[BOT V30] Webhook loaded. Mode: KEYWORD (Legacy).");

  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  
  // 3.1. XÁC MINH WEBHOOK (FACEBOOK YÊU CẦU)
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

  // 3.2. XỬ LÝ TIN NHẮN ĐẾN
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      try {
        for (const entry of body.entry) {
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;

            // --- TRƯỜNG HỢP A: BẤM NÚT "BẮT ĐẦU" HOẶC TỪ QUẢNG CÁO (CÓ REF) ---
            let refParam = null;
            if (webhook_event.referral) refParam = webhook_event.referral.ref;
            else if (webhook_event.postback?.referral) refParam = webhook_event.postback.referral.ref;
            else if (webhook_event.optin?.ref) refParam = webhook_event.optin.ref;

            if (refParam) {
                await handleReferral(sender_psid, refParam);
            } 
            // --- TRƯỜNG HỢP B: KHÁCH NHẮN TIN CHỮ ---
            else if (webhook_event.message && webhook_event.message.text) {
                const userMessage = webhook_event.message.text.trim();
                
                // === CHẨN ĐOÁN HỆ THỐNG (PING) ===
                if (userMessage.toLowerCase() === 'ping') {
                    const statusMsg = `PONG! Hệ thống [V30 - Keyword Mode] đang hoạt động.\n- FB Token: ${FB_PAGE_ACCESS_TOKEN ? 'OK' : 'MISSING'}\n- Cơ chế: Từ khóa (Không dùng AI)`;
                    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: statusMsg });
                    return res.status(200).send('EVENT_RECEIVED');
                }

                // === LOGIC TÌM TỪ KHÓA ===
                const matchedResponse = findKeywordResponse(userMessage);

                if (matchedResponse) {
                    // CÓ TỪ KHÓA -> TRẢ LỜI
                    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
                    await new Promise(r => setTimeout(r, 800)); // Giả vờ gõ phím
                    
                    if (matchedResponse.text) {
                        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: matchedResponse.text });
                    }
                    if (matchedResponse.imageUrl) {
                        await new Promise(r => setTimeout(r, 500));
                        await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, matchedResponse.imageUrl);
                    }
                    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
                } else {
                    // KHÔNG CÓ TỪ KHÓA -> IM LẶNG (SILENCE)
                    // Để chủ shop tự trả lời
                    console.log(`[BOT] Ignored message: "${userMessage}" (No keyword match)`);
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

// --- CÁC HÀM HỖ TRỢ GỬI TIN NHẮN (GIỮ NGUYÊN) ---
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
