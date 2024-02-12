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
    // Find the existing count or create a new record if not exists
    let apiHit = await campaignReport.findOne();

    if (!apiHit) {
      apiHit = new campaignReport();
    }

    // Increment the count and save in the database
    apiHit.count++;
    apiHit.responses.push(JSON.stringify(req.body)); // Save the response data
    await apiHit.save();

    // Log the API hit
    console.log('API Hit Count:', apiHit.count);
    console.log('Response Data:', req.body);

    // Respond with success
    res.status(200).json({ message: 'API Hit recorded successfully.', count: apiHit.count, response: req.body });
  } catch (error) {
    console.error('Error recording API hit:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});








export default router;
