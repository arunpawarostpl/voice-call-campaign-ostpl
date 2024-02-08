import express from "express";
import multer from "multer";
const router = express.Router();
import { createObdCampaigning } from "../controller/createCampaign.js";
import obdCampaignModel from "../models/obdCampaign.js";
import path from "path";
import axios from "axios";
const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: "audioFile", maxCount: 1 },
  { name: "numberFile", maxCount: 1 },
]);

router.post("/create-obd", cpUpload, async (req, res) => {
  try {
    console.log("enter in api");
  
    await createObdCampaigning(req, res);
    const apiUrl = 'https://calls.ostpl.com/obd/getdata';
    const response = await axios.post(apiUrl);

    // Handle the response data
    console.log('API Response:', response.data);
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

router.post('/getdata', (req, res) => {
  try {
    // Extracting request body parameters
    const { 
      CAMPAIGN_ID,
      SERVICE_TYPE,
      CALL_ID,
      DNI,
      A_PARTY_NO,
      CALL_START_TIME,
      A_PARTY_DIAL_START_TIME,
      A_PARTY_DIAL_END_TIME,
      A_PARTY_CONNECTED_TIME,
      A_DIAL_STATUS,
      A_PARTY_END_TIME,
      OG_DURATION
    } = req.body;

    // Log the received data to the console
    console.log('Received data:', req.body);

    // Validate if required parameters are present
    if (!CAMPAIGN_ID || !SERVICE_TYPE || !CALL_ID) {
      throw new Error('Missing required parameters.');
    }

    // Respond with the desired JSON structure
    const responseData = {
      CAMPAIGN_ID,
      SERVICE_TYPE,
      CALL_ID,
      DNI,
      A_PARTY_NO,
      CALL_START_TIME,
      A_PARTY_DIAL_START_TIME,
      A_PARTY_DIAL_END_TIME,
      A_PARTY_CONNECTED_TIME,
      A_DIAL_STATUS,
      A_PARTY_END_TIME,
      OG_DURATION
    };
console.log("Response Data",responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(400).json({ status: 'Error', message: error.message });
  }
});


async function fetchDataFromApi() {
  const apiUrl = 'https://calls.ostpl.com/obd/getdata';

  try {
    const response = await axios.get(apiUrl);
    console.log('Response:', response.data);
    // Handle the response data or perform further actions
  } catch (error) {
    console.error('Error:', error.message);
    // Handle errors
  }
}

// Call the function to fetch data from the API




export default router;
