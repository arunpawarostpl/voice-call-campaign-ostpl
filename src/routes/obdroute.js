import express from "express";
import multer from "multer";
const router = express.Router();
import { createObdCampaigning } from "../controller/createCampaign.js";
import obdCampaignModel from "../models/obdCampaign.js";
import path from "path";
import axios from "axios";
import campaignReport from "../models/report.js";
import updateCampaignReport from "../service/reportService.js";
const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: "audioFile", maxCount: 1 },
  { name: "numberFile", maxCount: 1 },
]);

router.post("/create-obd", cpUpload, async (req, res) => {
  try {  
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


router.post('/getdata', async (req, res) => {
  try {
    const bulkResponses = req.body;

    for (const bulkResponse of bulkResponses) {
      const responseData = bulkResponse.data; // Assuming reference ID is in response.data
      const CAMPAIGN_REF_ID = responseData.CAMPAIGN_REF_ID;

      // Find the existing document or skip if the campaign reference ID doesn't exist
      let apiHit = await campaignReport.findOne({ campaignRefId: CAMPAIGN_REF_ID });

      if (!apiHit) {
        console.log(`Campaign reference ID ${CAMPAIGN_REF_ID} not found in the database. Skipping...`);
        continue;
      }

      // Push the entire request body as a string to the responses array
      apiHit.hits[0].responses.push(JSON.stringify(req.body));

      await apiHit.save();

      // Log the API hit
      console.log('API Hit Count:', apiHit.hits[0].count);
      console.log('Response Data:', responseData);
    }

    // Respond with success
    res.status(200).json({ message: 'Bulk API Hits recorded successfully.' });
  } catch (error) {
    console.error('Error recording bulk API hits:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});








export default router;
