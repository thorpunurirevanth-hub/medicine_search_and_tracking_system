const multer = require("multer");

function createUpload(maxFileSize) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxFileSize, files: 1 },
    fileFilter(req, file, callback) {
      const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!acceptedTypes.includes(file.mimetype)) {
        const error = new Error("Choose a supported JPEG, PNG, WebP, or PDF file.");
        error.status = 400;
        return callback(error);
      }
      return callback(null, true);
    },
  });
}

const medicineImageUpload = createUpload(5 * 1024 * 1024).single("image");
const prescriptionUpload = createUpload(10 * 1024 * 1024).single("file");

module.exports = { medicineImageUpload, prescriptionUpload };