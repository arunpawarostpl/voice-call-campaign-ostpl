// app.js or index.js

import express from 'express';
import { fetchComplteData, generateCSV,generateUserCSV } from "../service/reportService.js"; // Adjust the path accordingly
import campaignReport from '../models/report.js';
const router = express.Router()
import fs from "fs"
import path from "path"

import { verifyToken } from '../validator/authService.js';
import obdCampaignModel from '../models/obdCampaign.js';



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
        console.log("token",token);
        const { UserRole, UserId } = verifyToken(token)
        const { campaignRefId } = req.query;
        if(UserRole=="admin"){
            const result = await generateUserCSV(campaignRefId);
        if (result) { 
          return  res.status(200).send( result)

        } else {
            return res.status(404).json({ error: result.error || 'Unknown error occurred' });
        }
        }
        const findLength= await obdCampaignModel.find({campaign_ref_Id:campaignRefId}).select('-audio')
        const campNumberLength=findLength.map(campaign => campaign.numbers.length);
        const result = await fetchComplteData(campaignRefId);
        const campNumberLengthValue = Array.isArray(campNumberLength) ? campNumberLength[0] : campNumberLength;
        console.log("bith",result.length,campNumberLength);

        

        if (result) {
            // Check if campNumberLengthValue is a valid number and result is an array-like object
            if (typeof campNumberLengthValue === 'number' && Array.isArray(result)) {
              // Compare the length of result with campNumberLengthValue
              if (campNumberLengthValue === result.length) {
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

export default router

