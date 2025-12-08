
// api/webhook.js
export default async function handler(req, res) {
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  
  // 1. XÁC MINH WEBHOOK (Facebook Ping)
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
            // Đây là tính năng chính bạn muốn giữ lại
            let refParam = null;
            if (webhook_event.referral) refParam = webhook_event.referral.ref;
            else if (webhook_event.postback?.referral) refParam = webhook_event.postback.referral.ref;
            else if (webhook_event.optin?.ref) refParam = webhook_event.optin.ref;

            if (refParam) {
                console.log(`[WEBHOOK] FOUND REF: ${refParam}`);
                await handleReferral(sender_psid, refParam);
            } 
            // --- TRƯỜNG HỢP 2: KHÁCH BẤM NÚT TRONG THẺ BÁO GIÁ ---
            // Giữ lại cái này để khi khách bấm "Liên Hệ KiNailRoom" thì có phản hồi xác nhận
            else if (webhook_event.postback) {
                const payload = webhook_event.postback.payload;
                if (payload === 'CHAT_WITH_HUMAN' || payload === 'CHAT_HUMAN') {
                    // Chỉ xác nhận ngắn gọn là đã nhận thông tin
                    await sendFacebookMessage(process.env.FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                        text: "Dạ vâng, em đã nhận thông tin ạ. Nàng đợi xíu nhân viên sẽ vào tư vấn trực tiếp cho mình nha! 💕" 
                    });
                }
            }
            
            // ĐÃ XÓA: Phần xử lý tin nhắn văn bản thường (webhook_event.message.text)
            // Bot sẽ IM LẶNG khi khách chat bình thường.
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

// --- HÀM XỬ LÝ REF (BÁO GIÁ TỪ WEB) ---
async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;

    // Bật typing để khách biết đang xử lý
    await sendSenderAction(FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');

    // Xử lý Mock/Demo
    if (recordId && recordId.startsWith('MOCK_')) {
        await new Promise(r => setTimeout(r, 1000));
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "🚧 Đang hiển thị dữ liệu DEMO:" });
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

    // Xử lý lấy dữ liệu thật từ Airtable
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

        // Gửi Ảnh
        if (imageUrl) await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        await new Promise(r => setTimeout(r, 500));

        // Gửi nội dung text + nút bấm
        const msgBody = `CHI TIẾT BÁO GIÁ:\n${detailsText}\n💰 TỔNG CỘNG: ${totalFormatted}\n\n⚠️ Đây là giá được phân tích và báo giá bằng AI, để biết giá cụ thể bạn cứ liên hệ trực tiếp Ki Nail hén.\n\nChat với tụi mình để chốt lịch nhé! 👇`;
        
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

// --- HELPER FUNCTIONS ---
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
