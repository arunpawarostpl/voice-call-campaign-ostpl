// controllers/whatsAppBusinessDataController.js
import  WhatsAppBusinessData from '../models/whatsAppBusinessData.js';

// Function to add or update the single WhatsApp Business Data record
const addOrUpdateWhatsAppBusinessData = async (req, res) => {
  try {
    const { wa_temp_token, wa_phone_id, wa_business_id } = req.body;

    // Find the existing document (there should only be one)
    let data = await WhatsAppBusinessData.findOne();

    if (data) {
      // Update the existing document
      data.wa_temp_token = wa_temp_token;
      data.wa_phone_id = wa_phone_id;
      data.wa_business_id = wa_business_id;
    } else {
      // Create a new document
      data = new WhatsAppBusinessData({
        wa_temp_token,
        wa_phone_id,
        wa_business_id
      });
    }

    // Save the document
    await data.save();

    res.status(200).json({ message: 'WhatsApp Business Data added/updated successfully', data });
  } catch (error) {
    res.status(500).json({ message: 'Error adding/updating WhatsApp Business Data', error });
  }
};

const getData = async (req, res) => {
    try {
      const { wa_temp_token, wa_phone_id, wa_business_id } = req.body;
  
      let data = await WhatsAppBusinessData.findOne();
  
      
  
      res.status(200).json({ message: 'WhatsApp Business Data get successfully', data });
    } catch (error) {
      res.status(500).json({ message: 'Error getting in WhatsApp Business Data', error });
    }
  };

export  { addOrUpdateWhatsAppBusinessData, getData };