
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
          // Lấy event đầu tiên trong mảng messaging
          // NOTE: Facebook có thể gửi nhiều loại event (messaging, standby, changes...)
          // Chúng ta tập trung vào messaging
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;
            console.log(`[WEBHOOK] Received event from User ID: ${sender_psid}`);

            // A. TÌM MÃ ĐƠN HÀNG (REF)
            // Ref có thể nằm ở nhiều vị trí tùy thuộc vào cách user click vào (nút Bắt đầu, Link m.me, hay quét QR)
            let refParam = null;
            
            // Case 1: Referral trực tiếp (User đang chat và bấm link m.me)
            if (webhook_event.referral) {
                refParam = webhook_event.referral.ref;
            } 
            // Case 2: Postback Referral (User bấm nút "Bắt đầu" lần đầu tiên)
            else if (webhook_event.postback && webhook_event.postback.referral) {
                refParam = webhook_event.postback.referral.ref;
            }
            // Case 3: Optin (User bấm plugin Chat trên web)
            else if (webhook_event.optin && webhook_event.optin.ref) {
                refParam = webhook_event.optin.ref;
            }

            // B. XỬ LÝ LOGIC
            if (refParam) {
                console.log(`[WEBHOOK] FOUND REF: ${refParam}`);
                await handleReferral(sender_psid, refParam);
            } else if (webhook_event.message && !webhook_event.message.is_echo) {
                // Nếu không có Ref nhưng là tin nhắn văn bản bình thường -> Phản hồi mặc định
                // Để user biết bot vẫn sống
                console.log("[WEBHOOK] Normal message received (No Ref)");
                await handleDefaultMessage(sender_psid);
            } else if (webhook_event.postback) {
                // Xử lý khi user bấm nút trong menu hoặc nút "Bắt đầu" mà không có ref
                console.log("[WEBHOOK] Postback received");
                await handleDefaultMessage(sender_psid);
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

// --- HÀM XỬ LÝ KHI CÓ MÃ ĐƠN HÀNG (QUAN TRỌNG) ---
async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return console.error("Missing Page Access Token");

    // 1. XỬ LÝ MOCK / DEMO
    if (recordId && recordId.startsWith('MOCK_')) {
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
        return;
    }

    // 2. XỬ LÝ PRODUCTION (LẤY TỪ AIRTABLE)
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
         await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "⚠️ Lỗi: Server chưa cấu hình Airtable." });
         return;
    }

    try {
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        if (!airtableRes.ok) {
            // Nếu không tìm thấy đơn, báo luôn cho khách biết
            await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                text: "⚠️ Không tìm thấy đơn báo giá này. Có thể đơn đã hết hạn." 
            });
            return;
        }

        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total, "Items Detail": itemsJson } = record.fields;

        // Helper format tiền tệ
        const fmt = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        const totalFormatted = fmt(total);

        let detailsText = "";
        try {
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) {
                // Tạo list chi tiết: Tên món: Giá tiền
                detailsText = items.map(i => `- ${i.item}: ${fmt(i.cost)}`).join('\n');
            }
        } catch (e) { console.error(e); }


        // GỬI TIN 1: ẢNH (QUAN TRỌNG ĐỂ KHÔNG BỊ CROP)
        if (imageUrl) {
            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        }

        // GỬI TIN 2: CHI TIẾT & NÚT
        // Lưu ý: Text button tối đa 20 ký tự. Text message tối đa 640 ký tự.
        const msgBody = `CHI TIẾT BÁO GIÁ:\n${detailsText}\n\n💰 TỔNG CỘNG: ${totalFormatted}\n\n⚠️ Đây là giá được phân tích và báo giá bằng AI, để biết giá cụ thể bạn cứ liên hệ trực tiếp Ki Nail hén.\n\nChat với tụi mình để chốt lịch nhé! 👇`;
        
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: msgBody.substring(0, 640), // Cắt bớt nếu quá dài để tránh lỗi
                    buttons: [
                        { type: "postback", title: "Liên Hệ KiNailRoom", payload: "CHAT_WITH_HUMAN" }
                    ]
                }
            }
        });

    } catch (error) {
        console.error("Airtable Fetch Error:", error);
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { text: "🚫 Có lỗi khi lấy dữ liệu báo giá." });
    }
}

// --- HÀM XỬ LÝ TIN NHẮN MẶC ĐỊNH (KHI KHÔNG CÓ REF) ---
async function handleDefaultMessage(sender_psid) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    if (!FB_PAGE_ACCESS_TOKEN) return;

    // Gửi tin nhắn chào mừng để user biết Bot đang hoạt động
    await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
        text: "Chào nàng! Ki Nail Room đã nhận được tin nhắn. Nếu nàng vừa gửi yêu cầu Báo Giá AI mà không thấy ảnh, hãy thử bấm lại vào link nhé! Hoặc nàng cứ nhắn tin ở đây, nhân viên sẽ trả lời sớm nhất ạ. 💖"
    });
}

// --- HELPER FUNCTIONS ---
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
