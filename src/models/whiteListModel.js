import mongoose from 'mongoose';
const { Schema } = mongoose;

// Define a User schema
const whiteListSchema = new mongoose.Schema({
    campaign_id:{type:String,required:true},
    numbers: [
        { type: String, required: true }
    ],
    createdBy: {type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true},
    // other fields as needed
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const whiteList=mongoose.model("whitelist",whiteListSchema )
// Create User model
export default whiteList
