
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Hàm tạo giao diện HTML đẹp mắt
  const renderPage = (title, message, detail, iconType, colorClass) => {
    // Chọn icon dựa trên trạng thái
    let iconSvg = '';
    if (iconType === 'success') {
      iconSvg = `<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce mx-auto mb-6"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>`;
    } else if (iconType === 'clean') {
      iconSvg = `<div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center animate-pulse mx-auto mb-6"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>`;
    } else {
      iconSvg = `<div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse mx-auto mb-6"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>`;
    }

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Ki Nail Room - System Cleanup</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Be+Vietnam+Pro:wght@400;600&display=swap" rel="stylesheet">
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  chestnut: { 500: '#964B34', 600: '#853e2a', 50: '#fcf6f5' },
                  vanilla: { 50: '#fbfaf4', 200: '#f1e8c0' }
                },
                fontFamily: {
                  serif: ['"Playfair Display"', 'serif'],
                  sans: ['"Be Vietnam Pro"', 'sans-serif'],
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-vanilla-50 min-h-screen flex items-center justify-center p-4 font-sans text-gray-700">
        <div class="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-chestnut-50 transform transition-all hover:scale-[1.01] duration-500">
          
          <!-- Header -->
          <div class="bg-chestnut-500 p-8 text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
               <div class="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
               <div class="absolute bottom-0 left-0 w-24 h-24 bg-vanilla-200 rounded-full blur-xl"></div>
            </div>
            <h1 class="text-2xl font-serif font-bold text-white relative z-10 tracking-wide">
              SYSTEM CLEANUP
            </h1>
            <p class="text-chestnut-50 text-xs uppercase tracking-[0.2em] mt-2 relative z-10 font-semibold opacity-80">
              Ki Nail Room Admin
            </p>
          </div>

          <!-- Content -->
          <div class="p-8 text-center">
            ${iconSvg}

            <h2 class="text-xl font-bold text-gray-800 mb-2 font-serif ${colorClass}">
              ${title}
            </h2>
            <p class="text-gray-600 mb-6 leading-relaxed">
              ${message}
            </p>

            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-500 font-mono break-all">
              ${detail}
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 p-4 text-center border-t border-gray-100">
            <a href="/" class="text-chestnut-600 hover:text-chestnut-500 font-bold text-sm transition-colors flex items-center justify-center gap-2 group">
              <span class="group-hover:-translate-x-1 transition-transform">←</span> Quay về trang chủ
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  try {
    // Tìm kiếm ảnh rác (Folder: AIPhanTich, Tag: ai_temp, Cũ hơn 3 ngày)
    // Cập nhật: Thêm điều kiện an toàn folder chính xác
    const searchExpression = 'folder:AIPhanTich AND tags:ai_temp AND created_at < 3d';
    
    const searchResult = await cloudinary.search
      .expression(searchExpression)
      .max_results(100)
      .execute();

    const resources = searchResult.resources;

    // Trường hợp 1: Sạch sẽ, không có gì để xóa
    if (resources.length === 0) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderPage(
        'Hệ Thống Sạch Sẽ',
        'Không tìm thấy ảnh rác nào cũ hơn 3 ngày trong folder AIPhanTich.',
        'Status: Clean • Target: > 3 days old',
        'clean',
        'text-blue-600'
      ));
    }

    // Trường hợp 2: Có rác, tiến hành xóa
    const publicIds = resources.map(img => img.public_id);
    await cloudinary.api.delete_resources(publicIds);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderPage(
      'Dọn Dẹp Thành Công',
      `Đã xóa vĩnh viễn <span class="text-2xl font-bold text-chestnut-600 mx-1">${publicIds.length}</span> ảnh rác khỏi hệ thống.`,
      `Deleted IDs: ${publicIds.length} items`,
      'success',
      'text-green-600'
    ));

  } catch (error) {
    console.error('[CLEANUP] Error:', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(renderPage(
      'Có Lỗi Xảy Ra',
      'Không thể thực hiện quy trình dọn dẹp lúc này.',
      `Error: ${error.message}`,
      'error',
      'text-red-600'
    ));
  }
}
