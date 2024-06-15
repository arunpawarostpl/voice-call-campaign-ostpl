// models/WhatsAppBusinessData.js
import mongoose from 'mongoose';

const WhatsAppBusinessDataSchema = new mongoose.Schema({
  wa_temp_token: {
    type: String,
    required: true,
  },
  wa_phone_id: {
    type: String,
    required: true,
  },
  wa_business_id: {
    type: String,
    required: true,
  }
});

const WhatsAppBusinessData = mongoose.model('WhatsAppBusiness', WhatsAppBusinessDataSchema);

export default WhatsAppBusinessData