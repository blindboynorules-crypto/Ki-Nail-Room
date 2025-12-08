
// api/webhook.js
export default async function handler(req, res) {
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  
  // 1. XÁC MINH WEBHOOK
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Verification failed');
      }
    }
  }

  // 2. XỬ LÝ SỰ KIỆN POST
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      try {
        // Duyệt qua tất cả các entry (có thể có nhiều event cùng lúc)
        for (const entry of body.entry) {
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;
            
            // A. TÌM MÃ ĐƠN HÀNG (REF)
            let refParam = null;
            
            if (webhook_event.referral) {
                refParam = webhook_event.referral.ref;
            } 
            else if (webhook_event.postback && webhook_event.postback.referral) {
                refParam = webhook_event.postback.referral.ref;
            }
            else if (webhook_event.optin && webhook_event.optin.ref) {
                refParam = webhook_event.optin.ref;
            }

            // B. XỬ LÝ LOGIC (CHỈ TRẢ LỜI KHI CÓ REF)
            if (refParam) {
                console.log(`[WEBHOOK] FOUND REF: ${refParam} -> Processing AI Quote`);
                await handleReferral(sender_psid, refParam);
            } else {
                // Nếu là tin nhắn thường hoặc click nút mà không có Ref từ web
                // -> IM LẶNG HOÀN TOÀN để nhân viên tư vấn
                console.log("[WEBHOOK] Normal interaction (No Ref) -> Ignored (Silent Mode)");
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

// --- HÀM XỬ LÝ KHI CÓ MÃ ĐƠN HÀNG TỪ WEB ---
async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return console.error("Missing Page Access Token");

    // Gửi tín hiệu "Đang soạn tin..." (Typing...)
    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');

    // 1. XỬ LÝ MOCK / DEMO
    if (recordId && recordId.startsWith('MOCK_')) {
        await new Promise(r => setTimeout(r, 1000)); // Giả vờ đợi 1s
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "🚧 Đang hiển thị dữ liệu DEMO (Do chưa kết nối Database):" });
        await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, "https://drive.google.com/thumbnail?id=1XSy0IKZ_D_bUcfHrmADzfctEuIkeCWIM&sz=w1000");
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "💅 Móng Úp + Vẽ: 130.000đ\n(Đây là tin nhắn mẫu)",
                    buttons: [{ type: "postback", title: "Liên Hệ KiNailRoom", payload: "CHAT_HUMAN" }]
                }
            }
        });
        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
        return;
    }

    // 2. XỬ LÝ PRODUCTION (LẤY TỪ AIRTABLE)
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
         // Chỉ báo lỗi nếu thực sự là flow Báo Giá nhưng server lỗi
         await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "⚠️ Lỗi: Server chưa cấu hình Airtable." });
         return;
    }

    try {
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        if (!airtableRes.ok) {
            await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                text: "⚠️ Không tìm thấy đơn báo giá này. Có thể đơn đã hết hạn." 
            });
            await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
            return;
        }

        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total, "Items Detail": itemsJson } = record.fields;

        const fmt = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        const totalFormatted = fmt(total);

        let detailsText = "";
        try {
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) {
                detailsText = items.map(i => `- ${i.item}: ${fmt(i.cost)}`).join('\n');
            }
        } catch (e) { console.error(e); }


        // GỬI TIN 1: ẢNH
        if (imageUrl) {
            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        }

        // Tạm dừng 1 xíu cho tin nhắn ảnh load xong (tạo cảm giác tự nhiên)
        await new Promise(r => setTimeout(r, 500));

        // GỬI TIN 2: CHI TIẾT
        const msgBody = `CHI TIẾT BÁO GIÁ:\n${detailsText}\n\n💰 TỔNG CỘNG: ${totalFormatted}\n\n⚠️ Đây là giá được phân tích và báo giá bằng AI, để biết giá cụ thể bạn cứ liên hệ trực tiếp Ki Nail hén.\n\nChat với tụi mình để chốt lịch nhé! 👇`;
        
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: msgBody.substring(0, 640), 
                    buttons: [
                        { type: "postback", title: "Liên Hệ KiNailRoom", payload: "CHAT_WITH_HUMAN" }
                    ]
                }
            }
        });

    } catch (error) {
        console.error("Airtable Fetch Error:", error);
    } finally {
        await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
    }
}

// --- HELPER FUNCTIONS ---
async function sendSenderAction(token, psid, action) {
    try {
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: psid },
                sender_action: action
            })
        });
    } catch (e) {
        console.error("Sender Action Error:", e);
    }
}

async function sendFacebookMessage(token, psid, messageContent) {
    try {
        const res = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: psid },
                message: messageContent
            })
        });
        const data = await res.json();
        if (data.error) {
            console.error("FB API Error:", data.error);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

async function sendFacebookImage(token, psid, imageUrl) {
     await sendFacebookMessage(token, psid, {
        attachment: {
            type: "image",
            payload: { 
                url: imageUrl, 
                is_reusable: true 
            }
        }
    });
}
