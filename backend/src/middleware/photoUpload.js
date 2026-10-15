
const multer = require("multer");
const sharp = require("sharp");
const { AppError } = require("./errorHandler");
const { getBucket } = require("../config/gridfs");

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(
        new AppError("Only JPG, PNG, and WEBP images are allowed.", 400)
      );
    }
    cb(null, true);
  },
});

async function processPhoto(req, res, next) {
  try {
    if (!req.file) return next();

    const buffer = await sharp(req.file.buffer)
      .resize(500, 500, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();

    const bucket = getBucket();
    const filename = `member-${Date.now()}-${Math.round(
      Math.random() * 1e6
    )}.webp`;

    const uploadStream = bucket.openUploadStream(filename, {
      contentType: "image/webp",
    });

    uploadStream.on("error", (err) => {
      console.error("Photo upload error:", err);
      if (!res.headersSent) next(err);
    });

    uploadStream.on("finish", () => {
      req.photoUrl = `/api/photos/${uploadStream.id.toString()}`;
      next();
    });

    uploadStream.end(buffer);
  } catch (err) {
    console.error("Photo processing error:", err);
    next(err);
  }
}

module.exports = { upload, processPhoto };
