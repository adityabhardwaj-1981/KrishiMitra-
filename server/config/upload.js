/**
 * Multer configuration for image uploads.
 * Uses memory storage on Vercel Serverless to prevent read-only filesystem errors.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isVercel = !!process.env.VERCEL;

let storage;

if (isVercel) {
  // On Vercel serverless, store in memory buffer
  storage = multer.memoryStorage();
} else {
  // Local development: store in uploads folder
  const uploadDir = path.resolve(__dirname, '..', 'uploads');
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const name = `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      },
    });
  } catch (err) {
    storage = multer.memoryStorage();
  }
}

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Only image files are allowed.'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
