
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

  // Lấy cấu hình Airtable và cắt bỏ khoảng trắng thừa (nếu có)
  const AIRTABLE_API_TOKEN = (process.env.AIRTABLE_API_TOKEN || '').trim();
  const AIRTABLE_BASE_ID = (process.env.AIRTABLE_BASE_ID || '').trim();
  const AIRTABLE_TABLE_NAME = 'Quotes'; 

  if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
    console.warn("Chưa cấu hình Airtable. Sử dụng Mock ID.");
    return res.status(200).json({ 
        success: true, 
        recordId: `MOCK_ORDER_${Date.now()}`,
        message: 'Mock mode (No Database configured)' 
    });
  }

  try {
    const { imageUrl, totalEstimate, items, note } = req.body;

    // Chuẩn bị dữ liệu khớp với tên cột trong Airtable
    const fields = {
      "Image URL": imageUrl,
      "Total Estimate": Number(totalEstimate), // Đảm bảo là số
      "Items Detail": JSON.stringify(items, null, 2), // Format đẹp
      "Note": note,
      "Created At": new Date().toISOString()
    };

    console.log("Sending to Airtable...", fields);

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
        console.error("Airtable Error Response:", data);
        // Trả về lỗi chi tiết từ Airtable để hiển thị ở Frontend
        const errorMessage = data.error?.message || data.error || 'Lỗi không xác định từ Airtable';
        throw new Error(errorMessage);
    }

    return res.status(200).json({ 
        success: true, 
        recordId: data.id 
    });

  } catch (error) {
    console.error("Save Quote Error:", error);
    return res.status(500).json({ message: 'Failed to save quote', error: error.message });
  }
}
