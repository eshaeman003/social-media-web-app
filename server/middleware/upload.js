const multer = require('multer');
const path = require('path');
module.exports = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname))
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^(image|video)\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Only images and videos are allowed'))
});
