// app.js or index.js

import express from 'express';
import { generateCSV,generateUserCSV } from "../service/reportService.js"; // Adjust the path accordingly
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
        // console.log("token",token);
        const { UserRole, UserId } = verifyToken(token)
        const { campaignRefId } = req.query;
        // if(UserRole=="admin"){
        //     const result = await generateUserCSV(campaignRefId);
        // if (result) { 
        //   return   res.status(200).send( result)

        // } else {
        //     return res.status(404).json({ error: result.error || 'Unknown error occurred' });
        // }
        // }
        const findLength= await obdCampaignModel.find({campaign_ref_Id:campaignRefId}).select('-audio')
        const campNumberLength=findLength.map(campaign => campaign.numbers.length);
// console.log("length",campNumberLength);
        const result = await generateUserCSV(campaignRefId);

        if (result) { 
            if(campNumberLength==result.length){
                return   res.status(200).send( result)
            }
        }
         else {
            return res.status(404).json({ error: result.error || 'Unknown error occurred' });
        }

    } catch (error) {
        console.error('Error handling CSV request:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.get('/checkStatus',async(req,res)=>{
    const { campaignRefId } = req.query;
console.log("id",campaignRefId);
    // Check if campaignRefId is undefined
    if (campaignRefId=="undefined") {
      return res.json({ status: 'Failed' }); // Return 'Failed' status if campaignRefId is undefined
    }
    
    try {
      // Retrieve the length of campaign numbers
      const findLength = await obdCampaignModel.findOne({ campaign_ref_Id: campaignRefId }).select('numbers');
      if (!findLength) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      const campNumberLength = findLength.numbers.length;
      const result = await generateUserCSV(campaignRefId);
      const resultLength = result.length;
      const status = campNumberLength === resultLength ? 'Completed' : 'Pending';
      res.json({ status });
    } catch (error) {
      console.error('Error occurred while checking status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
    
})

export default router

