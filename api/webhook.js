
// api/webhook.js
export default async function handler(req, res) {
  const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'kinailroom_verify';
  
  // 1. XÁC MINH WEBHOOK (Dành cho Facebook xác thực URL)
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

  // 2. XỬ LÝ SỰ KIỆN POST (Tin nhắn/Sự kiện từ người dùng)
  if (req.method === 'POST') {
    const body = req.body;

    if (body.object === 'page') {
      try {
        for (const entry of body.entry) {
          // Lấy event đầu tiên trong mảng messaging (quan trọng để tránh lỗi crash)
          const webhook_event = entry.messaging ? entry.messaging[0] : null;
          
          if (webhook_event) {
            const sender_psid = webhook_event.sender.id;

            // Kiểm tra tham số REF (Mã đơn hàng) từ đường dẫn m.me
            // Facebook gửi ref ở 2 chỗ tuỳ trường hợp:
            // 1. referral: Khi người dùng đã từng chat với page
            // 2. postback.referral: Khi người dùng mới bấm nút "Bắt đầu"
            let refParam = null;
            if (webhook_event.referral) {
                refParam = webhook_event.referral.ref;
            } else if (webhook_event.postback && webhook_event.postback.referral) {
                refParam = webhook_event.postback.referral.ref;
            }

            // Nếu tìm thấy mã đơn (Ref), tiến hành xử lý
            if (refParam) {
                console.log(`[WEBHOOK] Ref Found: ${refParam} | User: ${sender_psid}`);
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

// HÀM XỬ LÝ GỬI TIN NHẮN PHẢN HỒI
async function handleReferral(sender_psid, recordId) {
    const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

    // Kiểm tra Token Fanpage (Bắt buộc phải có)
    if (!FB_PAGE_ACCESS_TOKEN) {
        console.error("CRITICAL: Missing FB_PAGE_ACCESS_TOKEN in Env Variables");
        return;
    }

    // --- TRƯỜNG HỢP 1: CHẾ ĐỘ DEMO (MOCK MODE) ---
    // Nếu recordId bắt đầu bằng "MOCK_", nghĩa là web chưa kết nối Airtable.
    // Ta sẽ gửi dữ liệu mẫu để người dùng thấy tính năng hoạt động.
    if (recordId && recordId.startsWith('MOCK_')) {
        console.log("Handling Mock Order");
        
        // Gửi thông báo Demo
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            text: "🚧 [CHẾ ĐỘ DEMO] 🚧\n\nHệ thống ghi nhận bạn đang thử nghiệm mà chưa cấu hình Airtable.\nDưới đây là dữ liệu mẫu mô phỏng:"
        });

        // Gửi Ảnh Mẫu (Full Size)
        await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, "https://drive.google.com/thumbnail?id=1XSy0IKZ_D_bUcfHrmADzfctEuIkeCWIM&sz=w1000");

        // Gửi Báo Giá Mẫu
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "💅 BÁO GIÁ MẪU (DEMO):\n\n▫️ Sơn Gel: 80.000đ\n▫️ Vẽ Design: 50.000đ\n\n💎 TỔNG ƯỚC TÍNH: 130.000đ",
                    buttons: [
                        { type: "postback", title: "Chat với nhân viên 👩‍💼", payload: "CHAT_HUMAN_DEMO" }
                    ]
                }
            }
        });
        return;
    }

    // --- TRƯỜNG HỢP 2: CHẾ ĐỘ THỰC (PRODUCTION) ---
    const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    // Nếu thiếu cấu hình Airtable mà lại không phải Mock ID -> Báo lỗi
    if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
         await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            text: "⚠️ Lỗi hệ thống: Server chưa cấu hình Database (Airtable) để lấy dữ liệu đơn hàng."
        });
        return;
    }

    try {
        // Gọi Airtable để lấy thông tin đơn hàng dựa trên recordId
        const airtableRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Quotes/${recordId}`, {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });
        
        if (!airtableRes.ok) {
            await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
                text: "⚠️ Không tìm thấy đơn báo giá này trong hệ thống. Có thể đơn đã bị xóa hoặc mã không hợp lệ."
            });
            return;
        }

        const record = await airtableRes.json();
        const { "Image URL": imageUrl, "Total Estimate": total, "Items Detail": itemsJson } = record.fields;

        // Xử lý nội dung chi tiết báo giá
        let detailsText = "";
        try {
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            if (Array.isArray(items)) {
                detailsText = items.map(i => `▫️ ${i.item}: ${new Intl.NumberFormat('vi-VN').format(i.cost)}đ`).join('\n');
            }
        } catch (e) {
            console.error("Parse items error", e);
        }

        // Cắt ngắn nếu quá dài (Facebook giới hạn ký tự)
        if (detailsText.length > 500) detailsText = detailsText.substring(0, 497) + "...";
        const totalFormatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total);

        // BƯỚC 1: Gửi Ảnh (Image Attachment) - Giúp ảnh hiển thị Full màn hình, không bị crop
        if (imageUrl) {
            await sendFacebookImage(FB_PAGE_ACCESS_TOKEN, sender_psid, imageUrl);
        }

        // BƯỚC 2: Gửi Chi tiết & Tổng tiền (Button Template)
        const messageText = `💅 CHI TIẾT BÁO GIÁ AI:\n\n${detailsText}\n\n💎 TỔNG CỘNG: ${totalFormatted}\n\n(Giá mang tính chất tham khảo, vui lòng chat với nhân viên để chốt giá chính xác 👇)`;

        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: messageText, 
                    buttons: [
                        { type: "postback", title: "Chat với nhân viên 👩‍💼", payload: "CHAT_WITH_HUMAN" }
                    ]
                }
            }
        });

        console.log("[WEBHOOK SUCCESS] Messages sent to user.");

    } catch (error) {
        console.error("[WEBHOOK ERROR]:", error);
        await sendFacebookMessage(FB_PAGE_ACCESS_TOKEN, sender_psid, { 
            text: "🚫 Có lỗi xảy ra khi xử lý yêu cầu báo giá. Vui lòng thử lại sau." 
        });
    }
}

// --- CÁC HÀM HỖ TRỢ GỬI TIN NHẮN (HELPER FUNCTIONS) ---

// Gửi tin nhắn cơ bản (Text hoặc Template)
async function sendFacebookMessage(token, psid, messageContent) {
    try {
        await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: psid },
                message: messageContent
            })
        });
    } catch (e) {
        console.error("Send FB Message Error:", e);
    }
}

// Gửi ảnh đính kèm (Image Attachment)
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
