import mongoose from 'mongoose';

const { Schema } = mongoose;

const numberDni = new Schema({
  number: { type: String, required: true, unique: true },
  // You can add more fields as needed
}, { timestamps: true });

const CallingNumber = mongoose.model('dni', numberDni);

export default CallingNumber;
