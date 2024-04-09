// controllers/mediaController.js
import WatsappMedia from "../models/bussinessMediaModel.js"
import {uploadWhatsappMedia,sendMessage} from '../service/watsappMessageService.js'

const uploadMedia = async (req, res) => {
    const file = req.file; // Uploaded file details
    const { type,numbers,template_name } = req.body;

    console.log("numbers",numbers);



    if (!['video', 'pdf', 'image'].includes(type)) {
        return res.status(400).json({ message: 'Invalid media type. Allowed types: video, audio, pdf, image' });
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
console.log(token);
    try {
        const facebookId = await uploadWhatsappMedia(file, type, token);

        // Create a new Media document
        const media = new WatsappMedia({
            type,
            mediaId: facebookId,
            numbers:validNumbers,
            template_name // Use facebookId as the mediaId
        });

        // Save the media document to MongoDB
        await media.save();

        res.status(200).json({ message: 'Media uploaded successfully', media });
        if (facebookId && media) {
            try {
                const sendWhatsappMessage = await sendMessage(media,token);
                console.log('WhatsApp message sent successfully:', sendWhatsappMessage);
            } catch (error) {
                console.error('Failed to send WhatsApp message:', error);
                // Handle error, e.g., return an error response
                res.status(500).json({ message: 'Failed to send WhatsApp message', error });
            }
        }

    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ message: 'Error uploading media' });
    }
};


export default { uploadMedia };
