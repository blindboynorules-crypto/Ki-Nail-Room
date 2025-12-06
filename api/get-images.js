import { v2 as cloudinary } from 'cloudinary';

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { folder } = req.query;

  if (!folder) {
    return res.status(400).json({ message: 'Missing folder name' });
  }

  try {
    // TÌM ẢNH TRONG FOLDER
    // Lưu ý: folder:${folder} sẽ tìm ảnh nằm trực tiếp trong folder đó
    const result = await cloudinary.search
      .expression(`folder:${folder}`) 
      .sort_by('created_at', 'desc') // Ảnh mới nhất hiển thị trước
      .max_results(50) // Tăng số lượng ảnh lấy về
      .execute();

    const images = result.resources.map((resource) => resource.secure_url);

    res.status(200).json(images);
  } catch (error) {
    console.error('Cloudinary Fetch Error:', error);
    res.status(500).json({ message: 'Error fetching images', error: error.message });
  }
}