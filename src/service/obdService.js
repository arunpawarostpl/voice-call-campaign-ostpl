// import axios from "axios";
import got from "got";
import FormData from "form-data"
import fs from "fs"
import  XLSX from "xlsx"
import utils from "util"
import Campaign from '../models/campaignModel.js'
import fetch from "node-fetch";
import { promisify } from "util";
import wav from "node-wav"
import Wave from "wav"
import ffmpeg from 'fluent-ffmpeg';
import { getAudioInfo ,processAudioFile,convertAudioToWAV} from '../service/audioConverterService.js'

// import {promisify } from "util"
import {
  OBD_DNI,
   OBD_CAMPAIGN_ID,
} from '../utils/utils.js'
import obdCampaignModel from "../models/obdCampaign.js";
import axios from "axios";




    async function obdLogin(username,password) {
  
      try {
        const loginPayload = {
          username: username,
          password: password
        };
           console.log("@@@@@===>", loginPayload);
    
        const urlResponse = await axios.post('https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/AuthToken', {
          json: loginPayload,
          responseType: 'json',
          throwHttpErrors: false,
          headers: {
            'Content-Type': 'application/json'
          }
        });
    
        if (urlResponse.statusCode === 200 && urlResponse.body && urlResponse.body.idToken) {
          console.log("Campaign Token",urlResponse.body.idToken);
          return urlResponse.body.idToken;
        } else {
          console.log('Full Response:', urlResponse.body);
          throw new Error('Token not found in response');
        }
      } catch (error) {
        console.error('Error logging in:', error);
        throw new Error('Failed to log in and get token');
      }
    }
    
    async function createOBDCampaign(authToken, campaignData) {
      try {
          const headers = {
              Authorization: `Bearer ${authToken}`, // Added space after 'Bearer'
              'Content-Type': 'application/json'
          };
  
          const obdResponse = await got.post('https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/createOBDCampaign', {
              json: campaignData, // Send campaignData as JSON
              headers: headers
          });
  
          return obdResponse.body; // Using obdResponse.body to access response data
      } catch (error) {
          console.error('Error creating OBD campaign:', error.response ? error.response.body : error.message);
          throw new Error('Failed to create OBD campaign');
      }
  }
  

  async function  uploadOBDNumber(authtoken,obdNumberData){
    try {
     
      // const now = new Date();
      // const year = now.getFullYear();
      // const month = String(now.getMonth() + 1).padStart(2, '0'); 
      // const day = String(now.getDate()).padStart(2, '0');
      // const hours = String(now.getHours()).padStart(2, '0');
      // const minutes = String(now.getMinutes()).padStart(2, '0');
      // const seconds = String(now.getSeconds()).padStart(2, '0');
      // const fileName = `obdUploads/${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;

      const numbersList = obdNumberData.numberFile || [];
      const convertingData = numbersList.map(numbers => [numbers]);  
      const data =convertingData
      console.log("Converting data", data);
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([  ['msisdn'], // Header row
      ...data, ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

      
  try {
    XLSX.writeFile(workbook, 'obdUploads/data.xlsx');
    console.log('XLSX file created successfully:');
  } catch (error) {
    console.error('Error creating XLSX file:', error);
  }
const dni=obdNumberData[OBD_DNI];
  const formData = new FormData();
  formData.append('file', fs.createReadStream('obdUploads/data.xlsx'));
  formData.append('dni',obdNumberData[OBD_DNI])
  formData.append('campaign_ID',obdNumberData[OBD_CAMPAIGN_ID])

const obdNumberResponse = await fetch('https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/APICampaignBaseLoad', {
method:'POST' ,
body: formData, // Send campaignNumberData as JSON
  headers : {
    Authorization: `Bearer ${authtoken}`, // Added space after 'Bearer'
    ...formData.getHeaders(),
    "Content-Type": 'multipart/form-data',
}
    })
    // if (!obdNumberResponse.ok) {
    //   throw new Error(`HTTP error! Status: ${obdNumberResponse.status}`);
    // }
    console.log("numneruploadresponse",obdNumberResponse.body);
    return obdNumberResponse
    } catch (error) {
      console.error('Error creating OBD campaign:', error);
      throw new Error('Failed to create OBD campaign');
    }
  }

  
async function uploadObdMedia(authtoken,campaignId,obdId){
  try {
    const campaign= await  obdCampaignModel.findById(campaignId)



        
  //   if (campaign && campaign.audio && campaign.audio.data) {
      const audioBuffer = campaign.audio.data

      // const tempMP3File = 'obdUploads/temp.mp3';
      const outputFilePath = 'obdUploads/audio.wav';
    await  convertAudioToWAV(audioBuffer, outputFilePath)
  .then(() => {
    console.log('Conversion completed.');
  })
  .catch((error) => {
    console.error('Error:', error);
  });
 

  const formData = new FormData();
  formData.append('file', fs.createReadStream('obdUploads/audio.wav'));
    
  const voice_File_Type = 'c'
  // const audioData = generatedCampaignData.audio.data;
  const response=  await fetch(`https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/voiceUpload?campaign_ID=${obdId}&voice_File_Type=${voice_File_Type}`, {
    
    method:'POST' ,
    body: formData,
    headers : {
      Authorization: `Bearer ${authtoken}`, // Added space after 'Bearer'
      ...formData.getHeaders(),
      "Content-Type": 'multipart/form-data',
  },
    // responseType: 'json', 
});

// Handle or return the response
return (response.json)
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw new Error('Failed to upload audio');
  }
}


async function startOBD(obdId,authtoken){
  try {
    const obdStatus= 's'
    const postData = {
      campaign_id:obdId,
      status: obdStatus // Assuming you have a status value to send
  };
  console.log(obdId,authtoken);
   const response= await got.post("https://cts.myvi.in:8443/Cpaas/api/obdcampaignapi/StartorStop",{
    json: postData,
    responseType: 'json',
    throwHttpErrors: false,
    headers: {
      Authorization: `Bearer ${authtoken}`,
      'Content-Type': 'application/json'
    }
    
    })
return (response.body)

  } catch (error) {
    console.error('Error Start OBD campaign:', error);
    throw new Error('Failed to Start OBD campaign');
  }
}



export {obdLogin,createOBDCampaign,uploadOBDNumber,uploadObdMedia,startOBD} ;

