const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


const storage = multer.diskStorage({
destination: (req, file, cb) => cb(null, uploadDir),
filename: (req, file, cb) => {
const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
cb(null, unique + path.extname(file.originalname));
}
});


// only images (jpg/jpeg/png/webp)
function fileFilter(req, file, cb) {
const allowed = /jpeg|jpg|png|webp/;
const ext = path.extname(file.originalname).toLowerCase();
}


const upload = multer({
storage,
fileFilter,
limits: { fileSize: 12 * 1024 * 1024 }
});


module.exports = upload;