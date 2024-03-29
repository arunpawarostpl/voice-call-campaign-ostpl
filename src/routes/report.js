// app.js or index.js

import express from 'express';
import { generateCSV,generateUserCSV } from "../service/reportService.js"; // Adjust the path accordingly
import campaignReport from '../models/report.js';
const router = express.Router()
import fs from "fs"
import path from "path"

import { verifyToken } from '../validator/authService.js';



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
        const { campaignRefId } = req.query;
        console.log("@@@@@@@@@@@@");
        const result = await generateUserCSV(campaignRefId);
        if (result) { 
          return   res.status(200).send( result)

        } else {
            return res.status(404).json({ error: result.error || 'Unknown error occurred' });
        }

    } catch (error) {


        console.error('Error handling CSV request:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});





export default router

