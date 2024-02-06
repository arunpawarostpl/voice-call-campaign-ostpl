import mongoose from 'mongoose';
const { Schema } = mongoose;

// Define a User schema
const whiteListSchema = new mongoose.Schema({
    numbers: [
        { type: String, required: true }
    ],
    createdBy: {type: String,  
        required: true},
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

const whiteList=mongoose.model("whitelist",whiteListSchema )
// Create User model
export default whiteList
