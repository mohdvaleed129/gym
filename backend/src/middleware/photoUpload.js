const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { AppError } = require("./errorHandler");

const UPLOAD_DIR = path.join(__dirname, "../../uploads/members");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new AppError("Only JPG, PNG, and WEBP images are allowed.", 400));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

/**
 * Middleware to run after multer's single-file upload: compresses/resizes
 * the in-memory buffer and writes it to disk, attaching the public URL to
 * req.photoUrl. No-op if no file was uploaded.
 */
async function processPhoto(req, res, next) {
  try {
    if (!req.file) return next();

    const filename = `member-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await sharp(req.file.buffer)
      .resize(500, 500, { fit: "cover" })
      .webp({ quality: 82 })
      .toFile(filepath);

    req.photoUrl = `/uploads/members/${filename}`;
    next();
  } catch (err) {
    next(new AppError("Unable to process the uploaded photo. Please try a different image.", 400));
  }
}

module.exports = { upload, processPhoto };
