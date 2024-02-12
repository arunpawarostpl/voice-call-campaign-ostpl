import mongoose from "mongoose";
// Define a schema for API hits
const campaignreportSchema = new mongoose.Schema({
    campaignRefId: { type: String, required: true, unique: true },
    hits: [{
        count: { type: Number, default: 0 },
        responses: [String],
      }],
});

const campaignReport = mongoose.model('campaignreport', campaignreportSchema);

export default campaignReport
