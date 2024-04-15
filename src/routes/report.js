// app.js or index.js

import express from 'express';
import { fetchComplteData, generateCSV,generateUserCSV } from "../service/reportService.js"; // Adjust the path accordingly
import campaignReport from '../models/report.js';
const router = express.Router()
import fs from "fs"
import path from "path"
import { createObjectCsvWriter } from 'csv-writer';
import { verifyToken } from '../validator/authService.js';
import obdCampaignModel from '../models/obdCampaign.js';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "numberFile", maxCount: 1 },
]);
router.get('/generate-csv', async (req, res) => {
    try {
        const { campaignRefId } = req.query;
        const result = await generateCSV(campaignRefId);
        if (result) { 
            return   res.status(200).send( result)
  
          } else {
              return res.status(404).json({ error: result.error || 'Unknown error occurred' });
          }

    } catch (error) {
        console.error('Error handling CSV request:', error);
        console.log("error",error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/user-generate-csv', async (req, res) => {
    try {
        const token = req.headers.authorization
        const { UserRole, UserId } = verifyToken(token)
        const { campaignRefId } = req.query;
      
    
      
        const findLength= await obdCampaignModel.findOne({campaign_ref_Id:campaignRefId}).select('-audio')
        const findSendingLength=findLength.sendingNumber_length
        // const campNumberLength=findLength.map(campaign => campaign.numbers.length);
        const resultData = await fetchComplteData(campaignRefId);
        // const campNumberLengthValue = Array.isArray(campNumberLength) ? campNumberLength[0] : campNumberLength;
        // console.log("bith",resultData.length,campNumberLength);
        console.log(findSendingLength);

        if (resultData) {
            // Check if campNumberLengthValue is a valid number and result is an array-like object
            if (typeof findSendingLength === 'number') {
              // Compare the length of result with campNumberLengthValue
              if (findSendingLength === resultData.length) {
                const result = await generateUserCSV(campaignRefId);
                return res.status(200).send(result);
              } else {
                return res.status(404).json({ error: 'Campaign is in Pending Status' });
              }
            } else {
              return res.status(400).json({ error: 'Invalid campNumberLength or result' });
            }
          } else {
            return res.status(404).json({ error: 'Result not found' });
          }

    } catch (error) {
        console.error('Error handling CSV request:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.get('/checkStatus',async(req,res)=>{
    const { campaignRefId } = req.query;

    if (campaignRefId=="undefined") {
      return res.json({ status: 'Failed' }); // Return 'Failed' status if campaignRefId is undefined
    }
    try {
      
      const findLength = await obdCampaignModel.findOne({ campaign_ref_Id: campaignRefId }).select('sendingNumber_length');
      if (!findLength) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      const campNumberLength = findLength.sendingNumber_length;
      // console.log("num",campNumberLength);

      const result = await fetchComplteData(campaignRefId);
      const resultLength = result.length;
      const status = campNumberLength === resultLength ? 'Completed' : 'Pending';
      res.json({ status });
    } catch (error) {
      console.error('Error occurred while checking status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
    
})


router.delete('/',async(req,res)=>{
  const {userId} = req.query
  try {
    const deletedUser = await obdCampaignModel.findByIdAndDelete(userId);

    if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', deletedUser });
} catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
}
})


const getDialStatus = (phoneNumber) => {
  const lastDigit = Number(phoneNumber.slice(-1));

  if (lastDigit % 3 === 0) {
      return 'Timeout';
  } else if (lastDigit % 2 === 0) {
      return 'User Not Responding';
  } else {
      return 'Connected';
  }
};



router.get('/report', cpUpload, async (req, res) => {


  const numberBuffer = req.files["numberFile"] && req.files["numberFile"][0] ? req.files["numberFile"][0] : 0;
  const csvBuffer = numberBuffer?.buffer;
  const csvString = csvBuffer?.toString("utf-8");

  const number =csvString

  const phoneNumbers = [];
  phoneNumbers.push(number.toString())

// console.log("@@@",number);

  // const phoneNumbers = [
  //     '1234567890',
  //     '9876543210',
  //     '5551234567',
  //     // Add more phone numbers as needed
  // ];

  const csvWriter = createObjectCsvWriter({
    path: 'report.csv',
    header: [
        { id: 'A_PARTY_NO', title: 'A_PARTY_NO', alwaysQuote: true },
        { id: 'A_DIAL_STATUS', title: 'A_DIAL_STATUS', alwaysQuote: true },
        { id: 'obdcampaignname', title: 'obdcampaignname', alwaysQuote: true },
        { id: 'creditAction', title: 'creditAction', alwaysQuote: true },
        { id: 'createdAt', title: 'createdAt', alwaysQuote: true }
    ],
    append: false, // Ensure the CSV file is overwritten with new data
    encoding: 'utf8',
    fieldDelimiter: ','
});

const records = phoneNumbers.map(phoneNumber => ({
    A_PARTY_NO: phoneNumber,
    A_DIAL_STATUS: getDialStatus(phoneNumber),
    obdcampaignname: 'campaign 1',
    creditAction: '-2',
    createdAt: new Date().toISOString().slice(0, 10) // Current date in YYYY-MM-DD format
}));

try {
    await csvWriter.writeRecords(records);

    // Inform the client that the CSV file has been generated and saved
    res.json({ message: 'CSV report generated and saved locally' });
} catch (err) {
    console.error('Error generating CSV report:', err);
    res.status(500).json({ error: 'Internal Server Error' });
}
});




export default router

