import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { generateCSV } from "./fileUploadService.js";

async function cherryLogin(username,password){
    const loginPayload = {
        username: username,
        password: password,
      };
      try {
        const response = await axios.post(
          process.env.CHERRY_LOGIN, 
          loginPayload
        );
        console.log("data", response.data);
        return response.data; 
      } catch (error) {
        console.error("Error while fetching token:", error);
        throw error; // Propagate the error
      }
}

async function uploadVoice(userID,promtC,audioFileName,token){

    const userid=userID
    const fileName=audioFileName
    const promtCategory= promtC
    console.log("data",userid,fileName,promtCategory);
    try {
        const form = new FormData();
        form.append('waveFile', fs.createReadStream('obdUploads/audio.wav'));
        form.append('userId', userid);
        form.append('fileName', fileName);
        form.append('promptCategory', promtCategory);
        const headers = {
            Authorization: `Bearer ${token}`, // Added space after 'Bearer'
            "Content-Type": "multipart/form-data",
          };
          const url=process.env.CHERRY_VOICE_UPLOAD
          const response = await axios.post(url,form,{headers: {
            ...form.getHeaders(), 
            ...headers,
          }})
          const baseLoadresponse= response.data
        console.log("data", baseLoadresponse);
        return baseLoadresponse
    } catch (error) {
        console.error("Error while uploading VoiceFile", error);
        throw error; 
    }
}




async function uploadBaseload(userID,baseName,token,finalSubmissionNumber){
    const basename=baseName
    const contactList="null"
    const userid= userID
  
    try {
console.log("number",finalSubmissionNumber);
await generateCSV(finalSubmissionNumber);
        const form = new FormData();
        form.append('baseFile', fs.createReadStream('obdUploads/data.csv'));
        form.append('userId', userid);
        form.append('baseName', basename);
        form.append('contactList', contactList);
        const headers = {
            Authorization: `Bearer ${token}`, // Added space after 'Bearer'
            "Content-Type": "multipart/form-data",
          };
          const url=process.env.CHERRY_NUMBER_UPLOAD
          const response = await axios.post(url,form,{headers: {
            ...form.getHeaders(), 
            ...headers,
          }})
          const voiceResponse= response.data
        console.log("voice Upload", voiceResponse);
        const dataFile='obdUploads/data.csv'
        // fs.unlinkSync(dataFile);
          return voiceResponse
    } catch (error) {
        console.error("Error while uploading NumberFile", error);
        throw error; 
    }
}



async function composeCampaign(composeCampaignBaseLoad, token) {
  try {
    console.log("payload", composeCampaignBaseLoad);
    const headers = {
      Authorization: `Bearer ${token}`, // Added space after 'Bearer'
      "Content-Type": "application/json",
    };
    const url = process.env.CHERRY_COMPOSE_CAMPAIGN;
    console.log("url", url);
    const response = await axios.post(url, composeCampaignBaseLoad, { headers });
    console.log("Compose campaign Data", response.data);
    console.log("code",response.status);
    return response; // Return the entire response object
  } catch (error) {
    console.error("Error while composing campaign", error);
    throw error; 
  }
}




export{
  cherryLogin,
  uploadVoice,
  uploadBaseload,
  composeCampaign
}