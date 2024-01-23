import mongoose from 'mongoose';

const numberSchema = new mongoose.Schema({
    campaign_id:{type:String,required:true},
    numbers: [
        { type: String, required: true }
    ],
    createdBy: {type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true},
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }); 

const numbefile = mongoose.model('numberfile', numberSchema);

export default numbefile;