import express from "express";
import multer from "multer";
const router = express.Router();
import { createObdCampaigning } from "../controller/createCampaign.js";
import obdCampaignModel from "../models/obdCampaign.js";
import path from "path";
import axios from "axios";
import user from "../models/userModel.js";
import campaignReport from "../models/report.js";
import { verifyToken } from "../validator/authService.js";
import { fetchComplteData, generateUserCSV } from "../service/reportService.js";
import { rePush } from "../service/rePushService.js";
const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: "audioFile", maxCount: 1 },
  { name: "numberFile", maxCount: 1 },
]);

router.post("/create-obd", cpUpload, async (req, res) => {
  try { 
    console.log(req.body);
    await createObdCampaigning(req, res);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ message: "Route error", error: error.message });
  }
});

router.get("/getlist", async (req, res) => {
  try {
    
    const obdCampaigns = await obdCampaignModel.find({})
    const createdByUsernames = await user.find({ _id: { $in: obdCampaigns.map(campaign => campaign.createdBy) } }, 'username');
    const obdCampaignsWithUsernames = obdCampaigns.map(campaign => ({
      ...campaign.toObject(),
      createdByUsername: createdByUsernames.find(user => user._id.toString() === campaign.createdBy)?.username,
    }));

//  console.log("list",obdCampaignsWithUsernames);

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


router.get('/details',async(req,res)=>{
  try {
    // Get total user count where role is 'reseller'
    const resellerCount = await user.countDocuments({ role: 'reseller' });

    // Get total campaign count
    const campaignCount = await obdCampaignModel.countDocuments();

    // Get total user count where role is 'user'
    const userCount = await user.countDocuments({});
    // Send response
    res.json({
      resellerCount,
      campaignCount,
      userCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.get('/reseller-details',async(req,res)=>{
  try {


    const token = req.headers.authorization
    const { UserRole, UserId } = verifyToken(token)
    if(UserRole=='reseller'){
      const reselleruserCount = await user.countDocuments({createdBy:UserId});
      const resellercampaignCount = await obdCampaignModel.countDocuments({_id:UserId});
      return  res.json({
        reselleruserCount,
        resellercampaignCount
      });
    }else if(UserRole=="user"){
      const userCampaignCount= await obdCampaignModel.countDocuments({createdBy:UserId})
      return res.json({userCampaignCount})
    }
    
   




  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  
  }
})


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




router.post('/repush_campaign',async(req,res)=>{
  const {type, campaignRefId,createdById } = req.body;
 try {
  console.log("@@@@",createdById);
 await rePush(req,res)

 } catch (error) {
   console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
 }

})



export default router;
