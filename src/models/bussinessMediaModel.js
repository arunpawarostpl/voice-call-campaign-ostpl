// models/Media.js
import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['video', 'document', 'image'] // Define allowed media types
    },
    name: {
        type: String,
    },
    mediaId: {
        type: String
    },
    numbers: {
        type: [String], 
        
    },
    template_name:{
        type:String
    },
    file: {
        data: Buffer
      },
      language_code:{
        type:String
      }


});

const WatsappMedia = mongoose.model('Media', mediaSchema);

export default  WatsappMedia;
