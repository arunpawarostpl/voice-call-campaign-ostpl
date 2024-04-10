import express from 'express';
const router = express.Router()
import multer from 'multer';

import { uploadMedia } from '../controller/mediaController.js';
const upload = multer({ storage: multer.memoryStorage() });

// router.post('/', upload.single('file'),uploadMedia);

router.post("/", upload.single('file'), async (req, res) => {
    try { 
  
      await uploadMedia(req, res);
    } catch (error) {
      console.error("Route error:", error);
      res.status(500).json({ message: "Route error", error: error.message });
    }
  });

export default  router