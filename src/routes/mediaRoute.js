import express from 'express';
const router = express.Router()
import multer from 'multer';
import WhatsAppBusinessData from '../models/whatsAppBusinessData.js';

import { uploadMedia, captureAndSendMessages } from '../controller/mediaController.js';
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single('file'), async (req, res) => {
  let wh_business_data = await WhatsAppBusinessData.findOne();

  try {
    if (wh_business_data.wa_business_id && wh_business_data.wa_phone_id && wh_business_data.wa_temp_token) {
      if (req.body.type === "text") {
        // await sendTemplateMessages(req, res, wh_business_data);


        const token = wh_business_data.wa_temp_token;
        const mediaData = {
            type: req.body.type,
            template_name: req.body.template_name,
            language_code: req.body.language,
        };
        const numbers = req.body.numbers; // Example numbers
        const senderNumber  =  wh_business_data.wa_phone_id;
        
        captureAndSendMessages(req, res,token, mediaData, numbers, senderNumber)
            .then(() => {
                console.log('Process completed successfully.');
            })
            .catch((error) => {
                console.error('Process failed:', error.message);
            });

      } else {
        await uploadMedia(req, res, wh_business_data);
      }
    } else {
      res.status(500).json({ message: "Please update whatsApp Business Data" });
    }


  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ message: "Route error", error: error.message });
  }
});

export default router