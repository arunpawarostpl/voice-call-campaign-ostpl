import express from "express";
import multer from "multer";
const router = express.Router();
import { createObdCampaigning } from "../controller/createCampaign.js";
import obdCampaignModel from "../models/obdCampaign.js";
import path from "path";
import axios from "axios";
import ApiHit from "../models/report.js";
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
    let apiHit = await ApiHit.findOne();

    if (!apiHit) {
      apiHit = new ApiHit();
    }

    // Increment the count and save in the database
    apiHit.count++;
    await apiHit.save();

    // Log the API hit
    console.log('API Hit Count:', apiHit.count);

    // Respond with success
    res.status(200).json({ message: 'API Hit recorded successfully.', count: apiHit.count });
  } catch (error) {
    console.error('Error recording API hit:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});








export default router;
