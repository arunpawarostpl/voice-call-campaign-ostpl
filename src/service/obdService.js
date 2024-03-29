import FormData from "form-data";
import fs from "fs";
import XLSX from "xlsx";
import campaignReport from "../models/report.js";
import {
  convertAudioToWAV,
} from "../service/audioConverterService.js";
import obdCampaignModel from "../models/obdCampaign.js";
import axios from "axios";


async function obdLogin(username, password) {
  const loginPayload = {
    username: username,
    password: password,
  };

  try {
    const response = await axios.post(
      process.env.OBD_LOGIN_URL,
      loginPayload
    );
    console.log("token", response.data.idToken);
    return response.data.idToken;
  } catch (error) {
    console.error("Error while fetching token:", error);
    throw error; // Propagate the error
  }
}
async function createOBDCampaign(authToken, campaignData,campaign_ID) {
  try {
    const headers = {
      Authorization: `Bearer ${authToken}`, // Added space after 'Bearer'
      "Content-Type": "application/json",
    };
 
    const url=process.env.OBD_CREATE_CAMPAIGN

    const response = await axios.post(
     url,
      campaignData,
      { headers }
    );
    console.log("obdCampiagn Response", response.data);
    const campaignRefId = response.data.campaign_Ref_ID;
  
   const campaign_data = await obdCampaignModel.findById(campaign_ID);
   campaign_data.campaign_ref_Id = campaignRefId;
   await campaign_data.save();
    const savedDataReport = await campaignReport.create({ campaignRefId });
    console.log("Saved the campaignRefernse Id", savedDataReport);
    
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
console.log("obddata=======>", obdNumberData);
    const obdSenderId = obdNumberData.campaign_ID;
    const obdDniNumber = obdNumberData.dni;
console.log("data", obdSenderId, obdDniNumber);
    console.log("Enter in Number api ");


    const headers = {
      Authorization: `Bearer ${authtoken}`,
      "Content-Type": "multipart/form-data",
    };
    const form = new FormData();
    form.append('file', fs.createReadStream('obdUploads/data.xlsx'));
    form.append('dni',obdDniNumber)
    form.append('campaign_ID',obdSenderId)

    const url=process.env.OBD_UPLOAD_NUMBER 
    const response = axios.post(url,form,{
      headers: {
        ...form.getHeaders(), 
        ...headers,
      },
    })     .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.error(error);
    });

  return (response)
  } catch (error) {
    console.error("Error Uploading OBD Number", error);
    throw new Error("Failed to create OBD campaign");
  }
}

async function uploadObdMedia(authtoken, campaignId, obd_campaignId) {
  try {

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

    const url = `https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/voiceUpload?campaign_ID=${obd_campaignId}&voice_File_Type=${voice_File_Type}`
   const response=  await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        ...headers, 
      }
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
  try { 
    const headers = {
      "Content-Type": "application/json",

      Authorization: `Bearer ${authtoken}`
    };
    const response = await axios({
      method:'post',
      url:process.env.OBD_ACTION_URL,
      data:{
        campaign_ID: obd_campaignId,
        status: obdStatus,
      },headers:headers
    }).then(response => {
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



