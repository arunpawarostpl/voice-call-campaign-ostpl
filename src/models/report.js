import mongoose from "mongoose";
// Define a schema for API hits
const campaignreportSchema = new mongoose.Schema({
    campaignRefId: { type: String },
    hits: [
      {
        count: Number,
        responses: [Object], // This expects an array of objects
      },
    ],
});

const campaignReport = mongoose.model('campaignreport', campaignreportSchema);

export default campaignReport
