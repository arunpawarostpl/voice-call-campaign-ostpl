// models/Media.js
import mongoose from "mongoose";

const schema = new mongoose.Schema({
    type: {
        type: String,
    },
    numbers: {
        type: [String], 
        
    },
    template_name:{
        type:String
    },
      language_code:{
        type:String
      }


});

const waMessage = mongoose.model('wamessages', schema);

export default  waMessage;
