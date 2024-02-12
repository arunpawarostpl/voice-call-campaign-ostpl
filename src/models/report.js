import mongoose from "mongoose";
// Define a schema for API hits
const campaignreportSchema = new mongoose.Schema({
  campaignRefId: { type: String, required: true },
  hits: [{
    count: { type: Number, default: 0 },
    responses: [{
      CAMPAIGN_REF_ID: String,
      SERVICE_TYPE: String,
      CALL_ID: String,
      DNI: String,
      A_PARTY_NO: String,
      CALL_START_TIME: String,
      A_PARTY_DIAL_START_TIME: String,
      A_PARTY_DIAL_END_TIME: String,
      A_PARTY_CONNECTED_TIME: String,
      A_DIAL_STATUS: String,
      A_PARTY_END_TIME: String,
      OG_DURATION: String,
      DTMF: String,
    }],
  }],
});

const campaignReport = mongoose.model('campaignreport', campaignreportSchema);

export default campaignReport
