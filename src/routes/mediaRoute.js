import express from 'express';
const router = express.Router()
import multer from 'multer';

import mediaController from '../controller/mediaController.js';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the upload directory (e.g., 'uploads/')
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Specify the file name (e.g., using originalname)
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });
router.post('/', upload.single('file'),mediaController.uploadMedia);

export default  router