
import mongoose from 'mongoose';

const apiHitSchema = new mongoose.Schema({
    count: { type: Number, default: 0 },
    responses: [{ type: String }],
  })
  

  
const ApiHit = mongoose.model('ApiHit', apiHitSchema);

export default ApiHit
