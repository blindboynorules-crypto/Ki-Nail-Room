
const CLOUD_NAME = 'dgiqdfycy';
const UPLOAD_PRESET = 'kinailroom_upload';

export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url; // Trả về đường dẫn ảnh HTTPS
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};
