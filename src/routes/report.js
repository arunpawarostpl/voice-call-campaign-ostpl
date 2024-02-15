// app.js or index.js

import express from 'express';
import { generateCSV,generateUserCSV } from "../service/reportService.js"; // Adjust the path accordingly
import campaignReport from '../models/report.js';
const router = express.Router()
import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { verifyToken } from '../validator/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get('/generate-csv', async (req, res) => {
    try {
        const { campaignRefId } = req.query;
        const result = await generateCSV(campaignRefId);
        console.log("resule",result);

        if (result && result.downloadUrl) {
            const filePath = path.join(__dirname, 'public', 'files', 'export_report', `report_${campaignRefId}.csv`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`File ${filePath} deleted successfully.`);
            } else {
                console.log(`File ${filePath} does not exist.`);
            }
             res.status(200).json({ downloadUrl: result.downloadUrl });
            console.log(`File ${filePath} deleted successfully.`);

        } else {
            // Send an error response with the appropriate message
            return res.status(404).json({ error: result.error || 'Unknown error occurred' });
        }

    } catch (error) {
        // Log the error and send a generic error response
        console.error('Error handling CSV request:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/user-generate-csv', async (req, res) => {
    try {
        const { campaignRefId } = req.query;
        const result = await generateUserCSV(campaignRefId);
        // console.log("resule",result);

        if (result) {
            // const filePath = path.join(__dirname, 'public', 'files', 'export_report', `report_${campaignRefId}.csv`);
            // if ( fs.existsSync(filePath)) {
            //     fs.unlinkSync(filePath);
            //     console.log(`File ${filePath} deleted successfully.`);
            // } else {
            //     console.log(`File ${filePath} does not exist.`);
            // }
            // const datafind=result.finalNumbers
            // console.log("log",result.finalNumbers);
          return   res.status(200).send( result)
            // console.log(`File ${filePath} deleted successfully.`);

        } else {
            return res.status(404).json({ error: result.error || 'Unknown error occurred' });
        }

    } catch (error) {
        // Log the error and send a generic error response
        console.error('Error handling CSV request:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});





export default router

