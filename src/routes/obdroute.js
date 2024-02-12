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

async function fethdata (){
 const existingApiHits= await campaignReport.find();

  existingApiHits.forEach((hit) => {
    campaignDataMap.set(hit.campaignRefId, {
      count: hit.hits[0].count,
      responses: hit.hits[0].responses,
    });
  });
}


router.post('/getdata', async (req, res) => {
  const campaignDataMap = new Map();
  try {
    const responseData = req.body;
    const CAMPAIGN_REF_ID = responseData.CAMPAIGN_REF_ID;

    // Log the incoming data for debugging
    console.log('Incoming Data:', responseData);

    // Check if there's existing data for this CAMPAIGN_REF_ID in the map
    if (!campaignDataMap.has(CAMPAIGN_REF_ID)) {
      console.error(`No existing entry found for CAMPAIGN_REF_ID: ${CAMPAIGN_REF_ID}`);
      return res.status(404).json({ error: 'No existing entry found for CAMPAIGN_REF_ID' });
    }

    // Update the count and responses for this CAMPAIGN_REF_ID
    const campaignData = campaignDataMap.get(CAMPAIGN_REF_ID);
    campaignData.count++;
    campaignData.responses.push(responseData);

    // Save the data to the database (you can customize this part based on your schema)
    let apiHit = await campaignReport.findOne({ campaignRefId: CAMPAIGN_REF_ID });

    if (apiHit) {
      apiHit.hits[0] = {
        count: campaignData.count,
        responses: campaignData.responses,
      };

      await apiHit.save();

      console.log('API Hit Count:', campaignData.count);
      console.log('Response Data:', responseData);

      return res.status(200).json({ message: 'API Hit recorded successfully.' });
    } else {
      // If no document is found, create a new one
      apiHit = new campaignReport({
        campaignRefId: CAMPAIGN_REF_ID,
        hits: [
          {
            count: campaignData.count,
            responses: campaignData.responses,
          },
        ],
      });

      await apiHit.save();

      console.log('New API Hit Count:', campaignData.count);
      console.log('Response Data:', responseData);

      return res.status(200).json({ message: 'New API Hit recorded successfully.' });
    }
  } catch (error) {
    console.error('Error recording API hit:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});








export default router;
