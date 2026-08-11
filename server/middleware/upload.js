const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf",
  ];

  // Allow images
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  // Allow videos
  if (file.mimetype.startsWith("video/")) {
    return cb(null, true);
  }

  // Allow PDF
  if (file.mimetype === "application/pdf") {
    return cb(null, true);
  }

  cb(
    new Error("Only images, videos, and PDF files are allowed"),
    false
  );
};

const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },

  fileFilter,
});

module.exports = upload;