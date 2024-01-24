// import axios from "axios";
import got from "got";
import FormData from "form-data";
import fs from "fs";
import XLSX from "xlsx";
import utils from "util";
import fetch from "node-fetch";
import { promisify } from "util";
import wav from "node-wav";
import Wave from "wav";
import ffmpeg from "fluent-ffmpeg";
import {
  getAudioInfo,
  processAudioFile,
  convertAudioToWAV,
} from "../service/audioConverterService.js";

// import {promisify } from "util"
import { OBD_DNI, OBD_CAMPAIGN_ID } from "../utils/utils.js";
import obdCampaignModel from "../models/obdCampaign.js";
import axios from "axios";
import path from "path";

axios.create({
  baseURL: "https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/",
});

async function obdLogin(username, password) {
  const loginPayload = {
    username: username,
    password: password,
  };
  try {
    const response = await axios.post(
      "https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/AuthToken",
      loginPayload
    );
    console.log("token", response.data.idToken);
    return response.data.idToken;
  } catch (error) {
    console.error("Error while fetching token:", error);
    throw error; // Propagate the error
  }
}
async function createOBDCampaign(authToken, campaignData) {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`, // Added space after 'Bearer'
      "Content-Type": "application/json",
    };
    const response = await axios.post(
      "https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/createOBDCampaign",
      campaignData,
      { headers }
    );
    console.log("obdCampiagn Response", response.data);
    const CampaignId = response.data.campaign_ID;
    return CampaignId; // Using obdResponse.body to access response data
  } catch (error) {
    console.error(
      "Error creating OBD campaign:",
      error.response ? error.response.body : error.message
    );
    throw new Error("Failed to create OBD campaign");
  }
}

async function uploadOBDNumber(authtoken, obdNumberData) {
  try {
    const numbersList = obdNumberData.numberFile || [];
    const convertingData = numbersList.map((numbers) => [numbers]);
    const data = convertingData;
    console.log("Converting data", data);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["msisdn"], // Header row
      ...data,
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");

    try {
      XLSX.writeFile(workbook, "obdUploads/data.xlsx");
      console.log("XLSX file created successfully:");
    } catch (error) {
      console.error("Error creating XLSX file:", error);
    }

    // const dni=obdNumberData[OBD_DNI];
    // const formData = new FormData();
    console.log("obddata=======>", obdNumberData);
  
    // const filedata=  formData.append('file', fs.createReadStream('obdUploads/data.xlsx'));
    // const sendNumber = formData.append("dni", obdDniNumber);
    // const senderId = formData.append("campaign_ID", obdSenderId);
    const obdSenderId = obdNumberData.campaign_ID;
    const obdDniNumber = obdNumberData.dni;
    console.log("data", obdSenderId, obdDniNumber);
    console.log("Enter in Number api ");


    const headers = {
      // ...formData.getHeaders(),
      Authorization: `Bearer ${authtoken}`,
      "Content-Type": "multipart/form-data",
    };
    const form = new FormData();
    form.append('file', fs.createReadStream('obdUploads/data.xlsx'));
    form.append('dni',obdDniNumber)
    form.append('campaign_ID',obdSenderId)
    const url ="https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/APICampaignBaseLoad"
    const response = axios.post(url,form,{
      headers: {
        ...form.getHeaders(), // Set headers for FormData
        ...headers, // Add additional headers if needed
      },
    })     .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error(error);
    });

  return (response)


    // const response = await axios.post(
    //   "https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/APICampaignBaseLoad",
    //   {
    //     file: "../../obdUploads/data.xlsx",
    //     dni: obdDniNumber,
    //     campaign_ID: obdSenderId,
    //   },
    //   { headers }
    // );
    // console.log("Number Response", response.status);
    // return response.data;
  } catch (error) {
    console.error("Error Uploading OBD Number", error);
    throw new Error("Failed to create OBD campaign");
  }
}

async function uploadObdMedia(authtoken, campaignId, obd_campaignId) {
  try {
    console.log("campaignID , obd_campaignId",campaignId,obd_campaignId);
    const campaign = await obdCampaignModel.findById(campaignId);
    const audioBuffer = campaign.audio.data;
    const outputFilePath = "obdUploads/audio.wav";  
    await convertAudioToWAV(audioBuffer, outputFilePath)
      .then(() => {
        console.log("Conversion completed.");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    const voice_File_Type = "c";
const headers = {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${authtoken}`,
    };
    const form = new FormData();
    form.append('file', fs.createReadStream('obdUploads/audio.wav'));

    const url = `https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/voiceUpload?campaign_ID=${obd_campaignId}&voice_File_Type=${voice_File_Type}`;
   const response=  await axios.post(url, form, {
      headers: {
        ...form.getHeaders(), // Set headers for FormData
        ...headers, // Add additional headers if needed
      },
    })
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error(error);
      });

    return (response)
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw new Error("Failed to upload audio");
  }
}

async function startOBD(authtoken, obd_campaignId) {
  const obdStatus = "S"
    const postData = {
      campaign_ID: encodeURIComponent(obd_campaignId),
      status: obdStatus, // Assuming you have a status value to send
    } 
  try { 
    console.log("Post data====>", postData);
    const headers = {
      "Content-Type": "application/json",

      Authorization: `Bearer ${authtoken}`
    };
    const response = await axios({
      method:'post',
      url:"https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/StartorStop",
      data:{
        campaign_ID: obd_campaignId,
        status: obdStatus,
      },headers:headers
    }).then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error(error);
    });
    return (response)
    
  } catch (error) {
    console.error("Error Start OBD campaign:", error.data);
    throw new Error("Failed to Start OBD campaign");
  }
}

export {
  obdLogin,
  createOBDCampaign,
  uploadOBDNumber,
  uploadObdMedia,
  startOBD,
};



