import { v2 as cloudinary } from 'cloudinary';

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  // Set CORS headers to allow requests from your domain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { folder } = req.query;

  if (!folder) {
    return res.status(400).json({ message: 'Missing folder name' });
  }

  // Debug logs (Check Vercel Function Logs to see these)
  console.log(`[API] Fetching images from folder: ${folder}`);
  
  try {
    // TÌM ẢNH TRONG FOLDER (THUẬT TOÁN BAO SÂN)
    // 1. folder:${folder} -> Tìm chính xác folder tên đó ở gốc (vd: gallery)
    // 2. folder:kinailroom/${folder} -> Tìm folder nằm trong kinailroom (vd: kinailroom/gallery)
    // 3. folder:${folder}* -> Tìm các folder con (vd: gallery/2024)
    const expression = `folder:${folder} OR folder:kinailroom/${folder} OR folder:${folder}*`;
    
    const result = await cloudinary.search
      .expression(expression) 
      .sort_by('created_at', 'desc') // Ảnh mới nhất hiển thị trước
      .max_results(20) // GIỚI HẠN 20 ẢNH TỐI ĐA
      .execute();

    console.log(`[API] Found ${result.total_count} images using expr: ${expression}`);

    const images = result.resources.map((resource) => resource.secure_url);

    res.status(200).json(images);
  } catch (error) {
    console.error('[API] Cloudinary Fetch Error:', error);
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
}