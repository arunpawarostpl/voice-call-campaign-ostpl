import mongoose from "mongoose";
import moment from "moment/moment.js";
const transactionHistorySchema = new mongoose.Schema({
  creditAction:{type: String},
  remarks:{type: String},
  date:{type: String},
  time:{ type: String, required: true, default: () => moment().format('h.mm A') },
  addedBy:{type: String},
  balance:{type:Number},
  UserId:{type:String}
});

const transactionHistory = mongoose.model('transactionHistory', transactionHistorySchema);
export default transactionHistory