import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/png",  
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid Format'));
    }

    cb(null, true);
  }
});

export default upload;
