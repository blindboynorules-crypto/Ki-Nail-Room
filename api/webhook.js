
// api/webhook.js

// ============================================================
// 🎓 KHU VỰC TRAINING BOT (BẠN SỬA NỘI DUNG Ở ĐÂY)
// ============================================================
// Bot sẽ chỉ trả lời nếu tin nhắn của khách chứa các từ khóa bên dưới.
// Nếu không khớp từ khóa nào, Bot sẽ IM LẶNG để bạn trả lời.

const TRAINING_DATA = [
    {
        // 1. Hỏi địa chỉ
        keywords: ['địa chỉ', 'ở đâu', 'chỗ nào', 'đường nào', 'vị trí', 'map', 'bản đồ', 'đc', 'add', 'tiệm nằm', 'tiệm đâu', 'ghé làm'],
        // Dòng chữ địa chỉ chính xác + Link Google Maps
        text: "🏡 Dạ Ki ở 231 Đường số 8, Bình Hưng Hoà A ( cũ ), Bình Tân ạ.\n\nNàng bấm vào link này để xem bản đồ chỉ đường cho tiện nha 👇:\nhttps://maps.app.goo.gl/3z3iii6wd37JeJVp7?g_st=ipc"
    },
    {
        // 2. Hỏi Bảng giá / Menu
        keywords: ['bảng giá', 'giá', 'menu', 'dịch vụ', 'nhiêu tiền', 'bao nhiêu', 'nhiu', 'bnhieu', 'cost', 'price', 'rổ rá', 'giá rổ', 'bộ này'],
        text: "Dạ Ki gởi mình bảng giá dịch vụ tham khảo nha 💅✨. Nàng ưng mẫu nào nhắn Ki tư vấn thêm nhen!",
        imageUrl: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207535/BangGiaDichVu_pbzfkw.jpg"
    },
    {
        // 3. Hỏi Khuyến mãi / Combo
        keywords: ['khuyến mãi', 'combo', 'ưu đãi', 'giảm giá', 'chương trình', 'offer', 'ctkm', 'km', 'sale', 'deal', 'có giảm', 'quà', 'tặng', 'discount'],
        text: "Dạ Ki gởi mình chương trình khuyến mãi HOT hiện tại nha 🔥🎁. Nàng xem qua kẻo lỡ ưu đãi xịn nè!",
        imageUrl: "https://res.cloudinary.com/dgiqdfycy/image/upload/v1765207799/Noel2025_rxuc1y.jpg"
    },
    {
        // 4. Hỏi Số tài khoản (STK)
        keywords: ['stk', 'số tài khoản', 'chuyển khoản', 'bank', 'ngân hàng', 'ck'],
        text: "💳 Dạ thông tin chuyển khoản của Ki Nail Room đây ạ:\n\n✨ Ngân hàng: MB Bank (Quân Đội)\n✨ Số TK: 0919979763\n✨ Chủ TK: VO THI KIEU OANH\n\nNàng chuyển xong chụp màn hình gửi Ki check với nha! 🥰"
    },
    {
        // 5. Hỏi Wifi
        keywords: ['wifi', 'pass', 'mật khẩu mạng', 'mạng'],
        text: "📶 Wifi nhà Ki nè nàng ơi, mạnh xỉu luôn:\n\n👉 Tên: Ki Nail Room\n👉 Pass: 88888888 (8 số 8)\n\nNàng kết nối để lướt nét trong lúc làm đẹp nha! 🚀"
    },
    {
        // 6. Hỏi Giờ làm việc
        keywords: ['mấy giờ', 'giờ mở cửa', 'đóng cửa', 'lịch làm', 'open', 'close', 'mở cửa', 'đến mấy giờ'],
        text: "⏰ Tụi mình mở cửa từ: 9:30 sáng - 20:00 tối (Tất cả các ngày trong tuần) 🗓️.\n\nNàng ghé khung giờ nào nhắn Ki giữ lịch trước để không phải đợi lâu nha! 💖"
    },
    {
        // 7. Hỏi Hotline
        keywords: ['sđt', 'số điện thoại', 'hotline', 'gọi', 'alo', 'phone', 'liên lạc'],
        text: "📞 Hotline / Zalo của tụi mình: 0919 979 763.\n\nNàng cần gấp cứ gọi, Ki nghe máy liền ạ! 🤙"
    }
];
// ============================================================
// HẾT PHẦN TRAINING - KHÔNG SỬA CODE BÊN DƯỚI NẾU KHÔNG RÀNH
// ============================================================

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
            let refParam = null;
            if (webhook_event.referral) refParam = webhook_event.referral.ref;
            else if (webhook_event.postback?.referral) refParam = webhook_event.postback.referral.ref;
            else if (webhook_event.optin?.ref) refParam = webhook_event.optin.ref;

            if (refParam) {
                console.log(`[WEBHOOK] FOUND REF: ${refParam}`);
                await handleReferral(sender_psid, refParam);
            } 
            // --- TRƯỜNG HỢP 2: KHÁCH BẤM NÚT TRONG THẺ BÁO GIÁ (POSTBACK) ---
            else if (webhook_event.postback) {
                const payload = webhook_event.postback.payload;
                if (payload === 'CHAT_WITH_HUMAN' || payload === 'CHAT_HUMAN') {
                    await sendFacebookMessage(process.env.FB_PAGE_ACCESS_TOKEN, sender_psid, { 
                        text: "Dạ vâng, em đã nhận thông tin ạ. Nàng đợi xíu nhân viên sẽ vào tư vấn trực tiếp cho mình nha! 💕" 
                    });
                }
            }
            // --- TRƯỜNG HỢP 3: KHÁCH NHẮN TIN CHỮ (TEXT) -> CHẠY QUA BỘ LỌC TỪ KHÓA ---
            else if (webhook_event.message && webhook_event.message.text) {
                const userMessage = webhook_event.message.text.toLowerCase(); // Chuyển về chữ thường để so sánh
                
                // Tìm xem tin nhắn có chứa từ khóa nào trong TRAINING_DATA không
                const matchedRule = TRAINING_DATA.find(rule => 
                    rule.keywords.some(keyword => userMessage.includes(keyword))
                );

                if (matchedRule) {
                    // Nếu khớp từ khóa -> Bot tự trả lời
                    await sendSenderAction(process.env.FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_on');
                    // Giả vờ đợi 1 giây cho giống người
                    await new Promise(r => setTimeout(r, 1000));
                    
                    // 1. Gửi tin nhắn văn bản trước
                    if (matchedRule.text) {
                        await sendFacebookMessage(process.env.FB_PAGE_ACCESS_TOKEN, sender_psid, { text: matchedRule.text });
                    }

                    // 2. Gửi ảnh nếu có (Ví dụ: Bảng giá, Khuyến mãi)
                    if (matchedRule.imageUrl) {
                        // Đợi xíu cho tin nhắn text bay đi đã
                        await new Promise(r => setTimeout(r, 500));
                        await sendFacebookImage(process.env.FB_PAGE_ACCESS_TOKEN, sender_psid, matchedRule.imageUrl);
                    }

                    await sendSenderAction(process.env.FB_PAGE_ACCESS_TOKEN, sender_psid, 'typing_off');
                } else {
                    // Nếu KHÔNG khớp -> Bot im lặng (để bạn trả lời)
                    console.log(`[BOT] Ignored message: "${userMessage}" (No keywords match)`);
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

// --- HÀM XỬ LÝ REF (BÁO GIÁ TỪ WEB) ---
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
                    text: "💅 Móng Úp + Vẽ: 130.000đ\n(Đây là tin nhắn mẫu)",
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
