
# 💅 SỔ TAY VẬN HÀNH WEBSITE KI NAIL ROOM

Chào mừng chủ tiệm! Đây là file ghi chú lại toàn bộ quy trình vận hành website để bạn không bao giờ quên.

---

## 1. QUY TRÌNH TỔNG QUAN (WORKFLOW)

Mô hình website của bạn hoạt động như sau:
1.  **Code (AI Studio):** Nơi bạn viết mã, chỉnh sửa giao diện.
2.  **Lưu trữ (GitHub):** Nơi cất giữ mã nguồn an toàn.
3.  **Vận hành (Vercel):** Nơi đưa website lên mạng cho khách xem.

**Quy tắc bất di bất dịch:**
> Mỗi khi bạn chỉnh sửa xong ở AI Studio -> Bạn phải **Commit & Push** lên GitHub -> Vercel sẽ **Tự động** phát hiện và cập nhật website mới sau khoảng 1-2 phút.

---

## 2. HƯỚNG DẪN CẬP NHẬT NỘI DUNG THƯỜNG GẶP

Dưới đây là danh sách các file bạn cần tìm khi muốn thay đổi thông tin:

### 💰 A. Muốn sửa Bảng Giá / Dịch Vụ
*   **Vào file:** `constants.ts`
*   **Tìm đoạn:** `export const SERVICE_MENU`
*   **Hành động:** Sửa tên dịch vụ hoặc giá tiền trong dấu ngoặc `' '`.

### 🖼️ B. Muốn thay đổi Ảnh Slide (Trang chủ & Thư viện)
*   **Vào file:** `constants.ts`
*   **Tìm đoạn:** `GALLERY_IMAGES` (Thư viện ảnh 3D) hoặc `SERVICE_SHOWCASE_IMAGES` (Ảnh lướt ngang).
*   **Hành động:** Dán link ảnh Google Drive hoặc Cloudinary mới vào thay thế link cũ.

### 🤖 C. Muốn dạy lại AI (Thay đổi câu tư vấn / Báo giá)
*   **Vào file:** `services/geminiService.ts`
*   **Tìm đoạn:** `const prompt = ...` (Dòng khoảng 80-100).
*   **Hành động:** Sửa lại các quy tắc báo giá (ví dụ: tăng giá đính đá từ 3k lên 5k).

### 💬 D. Muốn sửa câu trả lời tự động của Chatbot (Facebook)
*   **Vào file:** `api/webhook.js`
*   **Tìm đoạn:** `const TRAINING_DATA`
*   **Hành động:** Thêm từ khóa mới hoặc sửa câu trả lời mẫu (địa chỉ, số tài khoản, pass wifi...).

### 📞 E. Muốn sửa thông tin liên hệ (SĐT, Link Fanpage)
*   **Vào file:** `components/Footer.tsx` hoặc `components/Navbar.tsx`.

---

## 3. CÁCH LƯU VÀ CẬP NHẬT (GIT COMMANDS)

Sau khi sửa xong code, bạn mở **Terminal** (Cửa sổ lệnh) lên và gõ lần lượt 3 lệnh sau:

**Bước 1: Gom tất cả thay đổi**
```bash
git add .
```

**Bước 2: Đóng gói và ghi chú (Ví dụ: Cap nhat bang gia)**
```bash
git commit -m "Cap nhat bang gia moi"
```

**Bước 3: Đẩy lên mạng (Lúc này Vercel sẽ tự chạy)**
```bash
git push
```

---

## 4. CẤU HÌNH BÍ MẬT (VERCEL ENV)

Nếu website bị lỗi AI không trả lời, hoặc không lưu được đơn hàng, hãy kiểm tra các "Chìa khóa" (API Key) trên Vercel.

**Truy cập:** Vercel Dashboard > Project Ki Nail Room > Settings > Environment Variables.

Danh sách các chìa khóa cần có:
1.  `API_KEY`: Khóa của Google Gemini (để AI chạy).
2.  `CLOUDINARY_*`: 3 khóa của Cloudinary (để upload ảnh).
3.  `FB_*`: Khóa của Facebook (để Chatbot chạy).
4.  `AIRTABLE_*`: Khóa của Airtable (để lưu đơn báo giá).

---

## 5. MẸO XỬ LÝ SỰ CỐ

*   **Lỗi ảnh không hiện?** -> Kiểm tra xem link ảnh có để chế độ "Công khai" (Anyone with the link) chưa.
*   **Lỗi AI báo giá sai?** -> Vào `geminiService.ts` sửa lại phần `prompt` cho kỹ hơn.
*   **Web chưa cập nhật sau khi push?** -> Chờ khoảng 2 phút, hoặc vào Vercel xem mục "Deployments" có bị đỏ (Error) không.

---

## 6. QUẢN LÝ TÊN MIỀN (DOMAIN)

Bạn đang sử dụng tên miền: **kinailroom.com** (Mua tại Namecheap).

Nếu lỡ tay xóa mất cấu hình, hãy vào **Namecheap > Advanced DNS** và nhập lại 2 dòng này để nối về Vercel:

| Type (Loại) | Host | Value (Giá trị) |
| :--- | :--- | :--- |
| **A Record** | `@` | `76.76.21.21` |
| **CNAME Record** | `www` | `cname.vercel-dns.com` |

*Lưu ý: Sau khi sửa DNS, thường mất từ 5 - 30 phút để website chạy ổn định.*

Chúc Ki Nail Room luôn đông khách! 💅✨