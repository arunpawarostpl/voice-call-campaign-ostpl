// models/Media.js
import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['video', 'pdf', 'image'] // Define allowed media types
    },
    mediaId: {
        type: String,
        required: true
    },
    numbers: {
        type: [String], 
        
    },
    template_name:{
        type:String
    }

});

const WatsappMedia = mongoose.model('Media', mediaSchema);

export default  WatsappMedia;
