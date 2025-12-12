
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

  // --- MOCK MODE (NẾU CHƯA CÓ API KEY) ---
  if (!AIRTABLE_API_TOKEN || !AIRTABLE_BASE_ID) {
    console.warn("Chưa cấu hình Airtable. Sử dụng Mock ID.");
    return res.status(200).json({ 
        success: true, 
        recordId: `MOCK_ORDER_${Date.now()}`,
        message: 'Mock mode (No Database configured)' 
    });
  }

  // --- HELPER: AUTO CLEANUP (XÓA CŨ GIỮ MỚI) ---
  // Hàm này kiểm tra nếu dữ liệu > 950 dòng thì xóa bớt 50 dòng cũ nhất
  const checkAndCleanOldRecords = async () => {
      try {
          // 1. Lấy danh sách ID và Ngày tạo, sắp xếp cũ nhất lên đầu
          // Lưu ý: Airtable phân trang 100 record/lần, cần loop để lấy hết (hoặc lấy đủ số lượng cần check)
          let allRecords = [];
          let offset = null;
          
          do {
              const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`);
              url.searchParams.append('fields[]', 'Created At'); // Chỉ lấy trường cần thiết để nhẹ
              url.searchParams.append('sort[0][field]', 'Created At');
              url.searchParams.append('sort[0][direction]', 'asc'); // Cũ nhất trước
              if (offset) url.searchParams.append('offset', offset);

              const response = await fetch(url.toString(), {
                  headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
              });
              const data = await response.json();
              
              if (data.records) allRecords = [...allRecords, ...data.records];
              offset = data.offset;
              
              // Tối ưu: Nếu đã vượt quá 1200 record thì dừng, không cần fetch hết database nếu quá lớn
              if (allRecords.length > 1200) break;

          } while (offset);

          console.log(`[AutoCleanup] Current records: ${allRecords.length}`);

          // 2. Kiểm tra giới hạn (Đặt ngưỡng an toàn là 950 / 1000)
          const MAX_SAFE_LIMIT = 950;
          
          if (allRecords.length >= MAX_SAFE_LIMIT) {
              const deleteCount = allRecords.length - MAX_SAFE_LIMIT + 20; // Xóa dư ra 20 dòng để trừ hao
              const recordsToDelete = allRecords.slice(0, deleteCount); // Lấy n dòng đầu tiên (cũ nhất)
              
              console.log(`[AutoCleanup] Database full. Deleting ${recordsToDelete.length} oldest records...`);

              // 3. Xóa theo batch (Tối đa 10 dòng 1 lần gọi)
              const idsToDelete = recordsToDelete.map(r => r.id);
              
              // Chia nhỏ mảng thành các chunk 10 phần tử
              for (let i = 0; i < idsToDelete.length; i += 10) {
                  const chunk = idsToDelete.slice(i, i + 10);
                  const deleteUrl = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`);
                  chunk.forEach(id => deleteUrl.searchParams.append('records[]', id));

                  await fetch(deleteUrl.toString(), {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
                  });
              }
              console.log("[AutoCleanup] Cleanup complete.");
          }
      } catch (e) {
          console.error("[AutoCleanup] Error:", e);
          // Không throw lỗi ở đây để code chính vẫn chạy tiếp (lưu đơn mới)
      }
  };

  try {
    // BƯỚC 1: CHẠY DỌN DẸP TRƯỚC (QUAN TRỌNG)
    await checkAndCleanOldRecords();

    // BƯỚC 2: LƯU ĐƠN MỚI
    const { imageUrl, totalEstimate, items, note } = req.body;

    const fields = {
      "Image URL": imageUrl,
      "Total Estimate": Number(totalEstimate), 
      "Items Detail": JSON.stringify(items, null, 2),
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
