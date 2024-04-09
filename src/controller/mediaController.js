// controllers/mediaController.js
import WatsappMedia from "../models/bussinessMediaModel.js"
import {uploadWhatsappMedia,sendMessage} from '../service/watsappMessageService.js'

async function uploadMedia (req, res){
    const file = req.file;
    const orignalName = file.originalname;
    const buffer = req.file.buffer;


     // Uploaded file details
    const { type,numbers,template_name,language } = req.body;

    console.log("numbers",numbers);



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

    const token = req.headers.authorization.split(' ')[1]; // Extract token from Authorization header
// console.log(token);
    try {

        // Create a new Media document
      
              // Create a new WatsappMedia document with the video data
              const media = new WatsappMedia({
                type,
                numbers: validNumbers,
                template_name,
                file: {
                //   filename: orignalName,
                  data: buffer,
                },
                language_code: language
              });
          
              // Save the media document to MongoDB
              await media.save();
          
              // Upload the WhatsApp media using the provided token and media data
            const medaiSenderId=  await uploadWhatsappMedia(token, media);
            console.log("id",medaiSenderId);
            const mediaId = media._id
            await WatsappMedia.findByIdAndUpdate(
                { _id:mediaId  },
                { mediaId: medaiSenderId },
                { new: true } 
              );
              // Send WhatsApp message after media upload
              const sendWhatsappMessage = await sendMessage(media, token);
              console.log('WhatsApp message sent successfully:', sendWhatsappMessage);
          
              // Return success response
              res.status(200).json({ message: 'Media uploaded and WhatsApp message sent successfully', media });
            
       

        // Save the media document to MongoDB

        

    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ message: 'Error uploading media' });
    }
};


export  { uploadMedia };
