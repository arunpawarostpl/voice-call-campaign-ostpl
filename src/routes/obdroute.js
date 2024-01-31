import express from "express";
import multer from "multer";
const router = express.Router();
import { createObdCampaigning } from "../controller/createCampaign.js";
import obdCampaignModel from "../models/obdCampaign.js";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: "audioFile", maxCount: 1 },
  { name: "numberFile", maxCount: 1 },
]);

router.post("/create-obd", cpUpload, async (req, res) => {
  try {
    console.log("enter in api");
    await createObdCampaigning(req, res);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ message: "Route error", error: error.message });
  }
});

router.get("/getlist", async (req, res) => {
  try {
    const list = await obdCampaignModel.find({}).select("-audio.data");
    res.json(list);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/obd/pingback', (req, res) => {
  try {
    const {
      CAMPAIGN_ID,
      SERVICE_TYPE,
      CALL_ID,
      DNI,
      A_PARTY_NO,
      CALL_START_TIME,
      A_PARTY_DIAL_START_TIME,
      A_PARTY_DIAL_END_TIME,
      A_PARTY_CONNECTED_TIME,
      A_DIAL_STATUS,
      A_PARTY_END_TIME,
      OG_DURATION
    } = req.body;

    // Log the received pingback data
    console.log('Received Pingback Data:');
    console.log('CAMPAIGN_ID:', CAMPAIGN_ID);
    console.log('SERVICE_TYPE:', SERVICE_TYPE);
    console.log('CALL_ID:', CALL_ID);
    console.log('DNI:', DNI);
    console.log('A_PARTY_NO:', A_PARTY_NO);
    console.log('CALL_START_TIME:', CALL_START_TIME);
    console.log('A_PARTY_DIAL_START_TIME:', A_PARTY_DIAL_START_TIME);
    console.log('A_PARTY_DIAL_END_TIME:', A_PARTY_DIAL_END_TIME);
    console.log('A_PARTY_CONNECTED_TIME:', A_PARTY_CONNECTED_TIME);
    console.log('A_DIAL_STATUS:', A_DIAL_STATUS);
    console.log('A_PARTY_END_TIME:', A_PARTY_END_TIME);
    console.log('OG_DURATION:', OG_DURATION);

    // Process the pingback data (add your processing logic here)

    // Send a success response
    res.json({ status: 'Success', message: 'Pingback received successfully' });
  } catch (error) {
    console.error('Error processing pingback:', error);
    // Send a failed response
    res.status(500).json({ status: 'Failed', message: 'Internal Server Error' });
  }
});;


export default router;
