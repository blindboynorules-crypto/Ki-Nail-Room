
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Lấy cấu hình Airtable từ biến môi trường
  const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = 'Quotes'; // Tên bảng trong Airtable của bạn

  if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
    // Nếu chưa cấu hình Airtable, trả về ID giả lập để test trên Frontend
    console.warn("Chưa cấu hình Airtable. Sử dụng Mock ID.");
    return res.status(200).json({ 
        success: true, 
        recordId: `MOCK_ORDER_${Date.now()}`,
        message: 'Mock mode (No Database configured)' 
    });
  }

  try {
    const { imageUrl, totalEstimate, items, note } = req.body;

    // Chuẩn bị dữ liệu gửi lên Airtable
    const fields = {
      "Image URL": imageUrl,
      "Total Estimate": totalEstimate,
      "Items Detail": JSON.stringify(items),
      "Note": note,
      "Created At": new Date().toISOString()
    };

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Airtable Error');
    }

    // Trả về ID của bản ghi vừa tạo (đây chính là mã ref)
    return res.status(200).json({ 
        success: true, 
        recordId: data.id 
    });

  } catch (error) {
    console.error("Save Quote Error:", error);
    return res.status(500).json({ message: 'Failed to save quote', error: error.message });
  }
}
