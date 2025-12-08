
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
        for (const entry of body.entry) {
          // Check if messaging array exists to prevent crash (quan trọng)
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;

            // Kiểm tra tham số REF từ đường dẫn m.me
            let refParam = null;
            if (webhook_event.referral) {
                refParam = webhook_event.referral.ref;
            } else if (webhook_event.postback && webhook_event.postback.referral) {
                refParam = webhook_event.postback.referral.ref;
            }

            if (refParam) {
                console.log(`[WEBHOOK] Ref: ${refParam} | User: ${sender_psid}`);
                await handleReferral(sender_psid, refParam);
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

// HÀM XỬ LÝ GỬI TIN NHẮN
async function handleReferral(sender_psid, recordId) {
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

    if (!AIRTABLE_API_TOKEN || !FB_PAGE_ACCESS_TOKEN) {
        console.error("Missing Env Variables: AIRTABLE or FB_TOKEN");
        return;
    }

    try {
        // 1. LẤY DỮ LIỆU TỪ AIRTABLE
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        if (!airtableRes.ok) {
            console.error("Airtable fetch failed:", airtableRes.status);
            return;
        }

        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total, "Items Detail": itemsJson } = record.fields;

        // 2. XỬ LÝ DỮ LIỆU TEXT
        let detailsText = "";
        try {
            // Parse JSON danh sách các mục (nếu có)
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) {
                detailsText = items.map(i => `▫️ ${i.item}: ${new Intl.NumberFormat('vi-VN').format(i.cost)}đ`).join('\n');
            }
        } catch (e) {
            console.error("Parse items error", e);
        }

        // Cắt bớt nội dung nếu quá dài (Facebook Button Template giới hạn text ~640 ký tự)
        if (detailsText.length > 500) {
            detailsText = detailsText.substring(0, 497) + "...";
        }

        const totalFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);

        // 3. GỬI TIN NHẮN 1: ẢNH (Image Attachment - Để hiển thị Full Size không bị crop)
        // Đây là thay đổi quan trọng giúp bạn xem được toàn bộ ảnh móng
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: sender_psid },
                message: {
                    attachment: {
                        type: "image",
                        payload: { 
                            url: imageUrl, 
                            is_reusable: true 
                        }
                    }
                }
            })
        });

        // 4. GỬI TIN NHẮN 2: CHI TIẾT BÁO GIÁ + NÚT BẤM (Button Template)
        const messageText = `💅 AI BÁO GIÁ CHI TIẾT:\n\n${detailsText}\n\n💎 TỔNG ƯỚC TÍNH: ${totalFormatted}\n\n(Giá này chỉ là tham khảo dựa trên ảnh, nhân viên Ki Nail Room sẽ tư vấn chốt giá kỹ hơn cho bạn nhé! 👇)`;

        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${FB_PAGE_ACCESS_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: sender_psid },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: messageText, 
                            buttons: [
                                {
                                    type: "postback",
                                    title: "Chat với nhân viên 👩‍💼",
                                    payload: "CHAT_WITH_HUMAN"
                                }
                            ]
                        }
                    }
                }
            })
        });

        console.log("[WEBHOOK SUCCESS] Messages sent.");

    } catch (error) {
        console.error("[WEBHOOK ERROR]:", error);
    }
}
