import mongoose from 'mongoose';

const { Schema } = mongoose;

const audioSchema = new Schema({
    audio: {
        filename: { type: String, required: true },
        data: Buffer
      },
      createdBy: {
        type:String,
        required: true
      },
}, { timestamps: true });

const audio = mongoose.model('dni', audioSchema);

export default audio;
