const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');

// Gói Cloudinary miễn phí giới hạn ảnh 10MB → ảnh lớn hơn được nén lại trước khi upload
const CLOUDINARY_MAX_BYTES = 9.5 * 1024 * 1024;

function isConfigured() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function shrinkIfTooLarge(buffer) {
  if (buffer.length <= CLOUDINARY_MAX_BYTES) return buffer;
  for (const [maxSide, quality] of [[3000, 85], [2400, 80], [1800, 75]]) {
    const out = await sharp(buffer).rotate()
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (out.length <= CLOUDINARY_MAX_BYTES) return out;
  }
  throw new Error('Ảnh quá lớn, không thể nén xuống dưới 10MB.');
}

async function uploadBuffer(buffer, folder = 'lumierferre') {
  if (!isConfigured()) throw new Error('Cloudinary chưa được cấu hình (backend/.env)');
  const data = await shrinkIfTooLarge(buffer);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(data);
  });
}

module.exports = { isConfigured, uploadBuffer, shrinkIfTooLarge };
