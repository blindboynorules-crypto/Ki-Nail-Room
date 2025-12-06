
import { v2 as cloudinary } from 'cloudinary';

// Cấu hình Cloudinary (Dùng chung biến môi trường)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  // Cho phép chạy từ trình duyệt
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  try {
    // 1. TÌM KIẾM ẢNH CẦN XÓA
    // Logic: 
    // - Nằm trong folder AIPhanTich
    // - Có tag là 'ai_temp' (để không xóa nhầm ảnh quan trọng)
    // - Thời gian tạo: Cũ hơn 3 ngày trước (created_at < 3d)
    const searchExpression = 'folder:AIPhanTich AND tags:ai_temp AND created_at < 3d';

    console.log(`[CLEANUP] Searching for: ${searchExpression}`);

    const searchResult = await cloudinary.search
      .expression(searchExpression)
      .max_results(100) // Xóa tối đa 100 ảnh mỗi lần chạy
      .execute();

    const resources = searchResult.resources;

    if (resources.length === 0) {
      return res.status(200).json({ 
        message: 'Sạch sẽ! Không có ảnh rác nào cũ hơn 3 ngày để xóa.', 
        deleted_count: 0 
      });
    }

    // Lấy danh sách Public ID để xóa
    const publicIds = resources.map(img => img.public_id);

    // 2. THỰC HIỆN XÓA
    const deleteResult = await cloudinary.api.delete_resources(publicIds);

    console.log(`[CLEANUP] Deleted ${publicIds.length} images.`);

    return res.status(200).json({
      message: 'Dọn dẹp thành công!',
      description: 'Đã xóa các ảnh tạm (tag: ai_temp) cũ hơn 3 ngày trong folder AIPhanTich.',
      deleted_count: publicIds.length,
      deleted_ids: publicIds,
      details: deleteResult
    });

  } catch (error) {
    console.error('[CLEANUP] Error:', error);
    return res.status(500).json({ 
      message: 'Có lỗi khi dọn dẹp', 
      error: error.message 
    });
  }
}
