import express from "express";
import multer from "multer";
const router = express.Router();
import { createObdCampaigning } from "../controller/createCampaign.js";
import obdCampaignModel from "../models/obdCampaign.js";
import path from "path";
import axios from "axios";
import user from "../models/userModel.js";
import campaignReport from "../models/report.js";
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
    const obdCampaigns = await obdCampaignModel.find({}).select("-audio.data");
    const createdByUsernames = await user.find({ _id: { $in: obdCampaigns.map(campaign => campaign.createdBy) } }, 'username');
    const obdCampaignsWithUsernames = obdCampaigns.map(campaign => ({
      ...campaign.toObject(),
      createdByUsername: createdByUsernames.find(user => user._id.toString() === campaign.createdBy)?.username,
    }));
 console.log("list",obdCampaignsWithUsernames);

    res.json(obdCampaignsWithUsernames);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.get("/getlist", async (req, res) => {
//   try {
//     const list = await obdCampaignModel.find({})
//       .populate({
//         path: 'createdBy',
//         select: 'username' // Include '_id' and 'username' fields from userModel
//       })
//       .select("-audio.data");
//     res.json(list);
//     console.log("list",list);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

router.post('/getdata', async (req, res) => {
  try {
    const responseData = req.body;  
    const CAMPAIGN_REF_ID = responseData.CAMPAIGN_REF_ID;
    const apiHit = await campaignReport.findOneAndUpdate(
      { campaignRefId: CAMPAIGN_REF_ID },
      {
        $inc: { 'hits.0.count': 1 }, // Increment the count
        $push: { 'hits.0.responses': responseData }, // Add the response
      },
      { upsert: true, new: true }
    );
    return res.status(200).json({ message: 'API Hit recorded successfully.' });
  } catch (error) {
    console.error('Error recording API hit:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});








export default router;
