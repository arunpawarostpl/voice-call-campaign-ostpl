// controllers/mediaController.js
import WatsappMedia from "../models/bussinessMediaModel.js";
import { uploadWhatsappMedia, sendMessage } from '../service/watsappMessageService.js';
import axios from 'axios';
import waMessage from "../models/waMessageModel.js";


async function uploadMedia(req, res, wh_business_data) {
  const file = req.file;
  const orignalName = file.originalname;
  const buffer = req.file.buffer;


  // Uploaded file details
  const { type, numbers, template_name, language } = req.body;
  if (!['video', 'document', 'image'].includes(type)) {
    return res.status(400).json({ message: 'Invalid media type. Allowed types: video, document, image' });
  }

  if (!numbers || typeof numbers !== 'string') {
    return res.status(400).json({ message: 'Invalid numbers format. Please provide a valid string of phone numbers.' });
  }


  const numberList = numbers.split('\n').map(num => num.trim());

  // Validate each number in the list
  const validNumbers = [];
  const invalidNumbers = [];

  numberList.forEach(num => {
    // Validate each number (e.g., check if it's a valid 10-digit number)
    if (/^\d{10}$/.test(num)) {
      validNumbers.push(num);
    } else {
      invalidNumbers.push(num);
    }
  });

  // Trim each number to remove leading/trailing whitespace

  console.log('Valid Mobile Numbers:', validNumbers);

  const token = wh_business_data.wa_temp_token;
  const wa_business_id = wh_business_data.wa_business_id;
  const wa_phone_id = wh_business_data.wa_phone_id;
  try {

    const media = new WatsappMedia({
      type,
      numbers: validNumbers,
      template_name,
      name: orignalName,
      // file: {
      //   filename: orignalName,
      //   data: buffer,
      // },
      language_code: language
    });

    // Save the media document to MongoDB
    await media.save();

    // Upload the WhatsApp media using the provided token and media data
    const medaiSenderId = await uploadWhatsappMedia(token, media, buffer, wa_phone_id);

    const mediaId = media._id
    await WatsappMedia.findByIdAndUpdate(
      { _id: mediaId },
      { mediaId: medaiSenderId },
      { new: true }
    );
    // Send WhatsApp message after media upload
    const sendWhatsappMessage = await sendMessage(media, token, wa_phone_id);
    console.log('WhatsApp message sent successfully:', sendWhatsappMessage);

    // Return success response
    res.status(200).json({ message: 'Media uploaded and WhatsApp message sent successfully', media });



    // Save the media document to MongoDB



  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ message: 'Error uploading media' });
  }
};



async function captureAndSendMessages(req, res, token, mediaData, numbers, senderNumber) {
  try {
      // Split, trim and validate the numbers
      const numberList = numbers.split('\n').map(num => num.trim());
      const validNumbers = [];
      const invalidNumbers = [];

      numberList.forEach(num => {
          // Validate each number (e.g., check if it's a valid 10-digit number)
          if (/^\d{10}$/.test(num)) {
              validNumbers.push(num);
          } else {
              invalidNumbers.push(num);
          }
      });


      // Save media data to the database
      const media = new waMessage({
          type: 'text',
          numbers: validNumbers,
          template_name: mediaData.template_name,
          language_code: mediaData.language_code
      });

      await media.save();

      // Send messages to valid numbers
      await sendTemplateMessages(req, res, token, media, senderNumber);

      // Send a single response after all messages are sent
      res.status(200).json({ message: 'Messages sent successfully.' });
  } catch (error) {
      console.error('Error capturing and sending messages:', error.message);
      res.status(500).json({ message: 'Failed to send messages.' });
  }
}

async function sendTemplateMessages(req, res, token, media, senderNumber) {
  try {
      const { numbers, template_name, language_code } = media;

      const batchSize = 50;
      const numberBatches = [];
      for (let i = 0; i < numbers.length; i += batchSize) {
          numberBatches.push(numbers.slice(i, i + batchSize));
      }

      for (const batch of numberBatches) {
          const payloadPromises = batch.map(async (recipientNumber) => {
           
            const payload = {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: `91${recipientNumber}`,
              type: 'template',
              template: {
                name: template_name,
                language: {
                  code: language_code
                },
                components: []
              }
            };
  
            const headers = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            };
  
            
           
            const url = `https://graph.facebook.com/v19.0/${senderNumber}/messages`;
            const response = await axios.post(url, payload, { headers });
           

          });

          // Execute all payload promises for the current batch
          await Promise.all(payloadPromises);
      }

      console.log('All messages sent successfully.');
      res.status(200).json({ message: 'Messages sent successfully.' })
  } catch (error) {
      console.error('Failed to send messages:', error.message);
      res.status(500).json({ message: `Failed to send messages : ${error.message}` })
      throw error;
  }
}


export { uploadMedia, captureAndSendMessages };
