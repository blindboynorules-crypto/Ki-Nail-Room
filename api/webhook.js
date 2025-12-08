
// api/webhook.js
export default async function handler(req, res) {
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  
  // 1. XÁC MINH WEBHOOK (FACEBOOK VERIFICATION)
  // Facebook sẽ gửi yêu cầu GET đến URL này để kiểm tra xem server có sống không
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

  // 2. XỬ LÝ SỰ KIỆN TỪ FACEBOOK (POST)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      // Duyệt qua các sự kiện (thường là messaging)
      for (const entry of body.entry) {
        // Facebook trả về một mảng messaging
        const webhook_event = entry.messaging[0];
        const sender_psid = webhook_event.sender.id;

        // KIỂM TRA: CÓ PHẢI USER VÀO TỪ LINK CÓ THAM SỐ REF KHÔNG?
        // Ví dụ: m.me/kinailroom?ref=REC12345
        // Sự kiện này nằm trong `referral` hoặc `postback.referral` (nếu bấm nút Get Started)
        let refParam = null;
        if (webhook_event.referral) {
            refParam = webhook_event.referral.ref;
        } else if (webhook_event.postback && webhook_event.postback.referral) {
            refParam = webhook_event.postback.referral.ref;
        }

        if (refParam) {
            console.log(`[WEBHOOK] Nhận được REF: ${refParam} từ User: ${sender_psid}`);
            // Xử lý gửi tin nhắn lại cho khách
            await handleReferral(sender_psid, refParam);
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not a page event');
  }
}

// HÀM XỬ LÝ LOGIC: TRA CỨU AIRTABLE -> GỬI TIN NHẮN FACEBOOK
async function handleReferral(sender_psid, recordId) {
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

    if (!AIRTABLE_API_TOKEN || !FB_PAGE_ACCESS_TOKEN) {
        console.error("[WEBHOOK ERROR] Thiếu biến môi trường FB hoặc Airtable");
        return;
    }

    try {
        // BƯỚC A: LẤY DỮ LIỆU TỪ AIRTABLE
        // Dùng recordId (chính là refParam) để lấy thông tin đơn hàng
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        if (!airtableRes.ok) {
            console.error("[WEBHOOK ERROR] Không tìm thấy Record trong Airtable:", recordId);
            return;
        }

        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total } = record.fields;

        // BƯỚC B: SOẠN TIN NHẮN "GENERIC TEMPLATE" ĐẸP MẮT
        // Gồm: Hình ảnh móng + Giá tiền + Nút bấm
        const responseMessage = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": `Báo Giá AI: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}`,
                        "subtitle": "Ki Nail Room đã nhận được mẫu của bạn. Nhân viên sẽ tư vấn chi tiết ngay ạ! 👇",
                        "image_url": imageUrl,
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Chat với nhân viên",
                                "payload": "CHAT_WITH_HUMAN"
                            }
                        ]
                    }]
                }
            }
        };

        // BƯỚC C: GỌI FACEBOOK GRAPH API ĐỂ GỬI TIN
        const fbRes = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: sender_psid },
                message: responseMessage
            })
        });

        if (fbRes.ok) {
            console.log("[WEBHOOK SUCCESS] Đã gửi báo giá cho khách hàng.");
        } else {
            const errData = await fbRes.json();
            console.error("[WEBHOOK ERROR] Lỗi gửi tin FB:", errData);
        }

    } catch (error) {
        console.error("[WEBHOOK CRITICAL ERROR]:", error);
    }
}
