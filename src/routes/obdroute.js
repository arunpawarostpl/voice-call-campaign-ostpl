import express from "express";
import multer from "multer";
const router = express.Router();
import { createObdCampaigning } from "../controller/createCampaign.js";
import obdCampaignModel from "../models/obdCampaign.js";
import path from "path";
import axios from "axios";
import campaignReport from "../models/report.js";
const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: "audioFile", maxCount: 1 },
  { name: "numberFile", maxCount: 1 },
]);

router.post("/create-obd", cpUpload, async (req, res) => {
  try { 
    console.log("asdsafsdafgds"); 
    await createObdCampaigning(req, res);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ message: "Route error", error: error.message });
  }
});

router.get("/getlist", async (req, res) => {
  try {
    const list = await obdCampaignModel.find({}).select("-audio.data");
    console.log("list",list);
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
  try {
    const responseData = req.body;  // Assuming req.body is already parsed JSON
    const CAMPAIGN_REF_ID = responseData.CAMPAIGN_REF_ID;

    // Log the incoming data for debugging
    console.log('Incoming Data:', responseData);

    // Update the count and responses for this CAMPAIGN_REF_ID
    const apiHit = await campaignReport.findOneAndUpdate(
      { campaignRefId: CAMPAIGN_REF_ID },
      {
        $inc: { 'hits.0.count': 1 }, // Increment the count
        $push: { 'hits.0.responses': responseData }, // Add the response
      },
      { upsert: true, new: true }
    );

    console.log('API Hit Count:', apiHit.hits[0].count);
    console.log('Response Data:', responseData);

    return res.status(200).json({ message: 'API Hit recorded successfully.' });
  } catch (error) {
    console.error('Error recording API hit:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});








export default router;
