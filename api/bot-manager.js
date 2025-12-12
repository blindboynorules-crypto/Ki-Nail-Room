
export default async function handler(req, res) {
  // api/bot-manager.js
  // API quản lý dữ liệu Chatbot (CRUD Airtable)

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLE_NAME = 'BotConfig';

  if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ success: false, message: 'Chưa cấu hình Airtable API Token hoặc Base ID.' });
  }

  const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`;
  const HEADERS = {
    'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. GET: Lấy danh sách
    if (req.method === 'GET') {
      const response = await fetch(`${BASE_URL}?maxRecords=100&view=Grid%20view&sort%5B0%5D%5Bfield%5D=Keyword`, { headers: HEADERS });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || 'Lỗi tải dữ liệu');

      // Format dữ liệu gọn gàng để trả về Client
      const records = data.records.map(r => ({
        id: r.id,
        keyword: r.fields.Keyword || '',
        answer: r.fields.Answer || '',
        // Xử lý ảnh: Nếu là Attachment (Array) lấy url đầu tiên, nếu là String lấy nguyên văn
        imageUrl: (Array.isArray(r.fields.Image) && r.fields.Image.length > 0) 
                  ? r.fields.Image[0].url 
                  : (r.fields.ImageUrl || '')
      }));

      return res.status(200).json({ success: true, records });
    }

    // 2. POST: Tạo mới
    if (req.method === 'POST') {
      const { keyword, answer, imageUrl } = req.body;
      
      const fields = {
        "Keyword": keyword.toUpperCase(),
        "Answer": answer
      };

      // Nếu có ảnh, Airtable yêu cầu định dạng mảng object cho cột Attachment
      if (imageUrl) {
         fields["Image"] = [{ url: imageUrl }];
      }

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ fields })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || 'Lỗi tạo mới');
      return res.status(200).json({ success: true, id: data.id });
    }

    // 3. PATCH: Cập nhật
    if (req.method === 'PATCH') {
      const { id, keyword, answer, imageUrl } = req.body;
      
      const fields = {
        "Keyword": keyword.toUpperCase(),
        "Answer": answer
      };

      if (imageUrl) {
         fields["Image"] = [{ url: imageUrl }];
      } else {
         // Nếu muốn xóa ảnh, gửi mảng rỗng hoặc null (tuỳ cấu hình, an toàn nhất là gửi mảng rỗng nếu user xoá)
         // Ở đây ta giả định nếu không gửi imageUrl thì giữ nguyên (logic UI) hoặc gửi null để xóa.
         // Để đơn giản: UI gửi imageUrl = "" để xóa.
         if (imageUrl === "") fields["Image"] = [];
      }

      const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({ fields })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || 'Lỗi cập nhật');
      return res.status(200).json({ success: true });
    }

    // 4. DELETE: Xóa
    if (req.method === 'DELETE') {
      const { id } = req.body; // Hoặc query param tuỳ design, ở đây dùng body cho đồng bộ
      // Với DELETE request body, một số client có thể không gửi được, nên check cả query
      const recordId = id || req.query.id;

      const response = await fetch(`${BASE_URL}/${recordId}`, {
        method: 'DELETE',
        headers: HEADERS
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || 'Lỗi xóa');
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error("Bot Manager API Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
