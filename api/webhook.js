
// Đây là file xử lý Webhook từ Facebook
export default async function handler(req, res) {
  // 1. XÁC MINH WEBHOOK (FACEBOOK VERIFICATION)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';

    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('WEBHOOK_VERIFIED');
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send('Verification failed');
      }
    }
  }

  // 2. XỬ LÝ SỰ KIỆN (POST)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      // Duyệt qua các entry (thường chỉ có 1)
      for (const entry of body.entry) {
        const webhook_event = entry.messaging[0];
        const sender_psid = webhook_event.sender.id;

        // KIỂM TRA XEM CÓ PHẢI LÀ REFERRAL (BẤM TỪ LINK M.ME) KHÔNG?
        // Cấu trúc: m.me/PageID?ref=RECORD_ID
        if (webhook_event.referral || (webhook_event.postback && webhook_event.postback.referral)) {
            
            const refParam = webhook_event.referral?.ref || webhook_event.postback?.referral?.ref;
            
            if (refParam) {
                console.log(`Nhận được Ref: ${refParam} từ User: ${sender_psid}`);
                // Gọi hàm xử lý gửi tin nhắn lại cho khách
                await handleReferral(sender_psid, refParam);
            }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.status(404).send('Not a page event');
  }
}

// HÀM XỬ LÝ LOGIC TRẢ LỜI
async function handleReferral(sender_psid, recordId) {
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

    if (!AIRTABLE_API_TOKEN || !FB_PAGE_ACCESS_TOKEN) {
        console.error("Thiếu biến môi trường FB hoặc Airtable");
        return;
    }

    try {
        // 1. Lấy dữ liệu báo giá từ Airtable dựa trên recordId (ref)
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        if (!airtableRes.ok) throw new Error("Không tìm thấy đơn hàng trong Airtable");
        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total, "Items Detail": itemsJson } = record.fields;

        // 2. Soạn tin nhắn trả lời (Generic Template)
        const responseMessage = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [{
                        "title": `Báo Giá AI: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}`,
                        "subtitle": "Đây là mẫu nail bạn vừa chọn. Shop sẽ tư vấn chi tiết ngay ạ! 👇",
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

        // 3. Gửi tin nhắn qua Graph API
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: sender_psid },
                message: responseMessage
            })
        });

    } catch (error) {
        console.error("Error handling referral:", error);
    }
}
