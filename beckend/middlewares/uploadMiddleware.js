const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

const uploadDir = "uploads/";

fs.ensureDir(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null,Date.now() + path.extname(file.originalname));
    }
})

const upload = multer({storage });

module.exports = upload;