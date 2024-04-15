import { verifyToken } from "../validator/authService.js";
import obdCampaignModel from "../models/obdCampaign.js";
import whiteList from "../models/whiteListModel.js";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import {
  createOBDCampaign,
  obdLogin,
  startOBD,
  uploadOBDNumber,
  uploadObdMedia,
} from "../service/obdService.js";

import { composeCampaign,cherryLogin,uploadVoice,uploadBaseload } from "../service/msgcherryService.js";
import {
  OBD_CAMPAIGN_NAME,
  OBD_CAMPAIGN_DESCRIPTION,
  OBD_CAMPAIGN_TYPE,
  OBD_DNI,
  FROM_DATE,
  TO_DATE,
  FROM_TIME,
  TO_TIME,
  DIAL_TIMEOUT,
  RETRY_INTERVAL_TYPE,
  RETRY_INTERVAL_VALUE,
  RETRY_COUNT,
  API_REQUEST,
  PING_BACK_URL,
  WELCOME_PROMPT,
  DTMF_REQUEST,
  DTMF_LENGTH,
  DTMF_RETRY,
  RETRY_LIMIT_EXCEEDED_PROMPT,
  THANKS_PROMPT,
  OBD_FILE,
  OBD_CAMPAIGN_ID,
  STATUS,
  CHERRY_USER_ID,
  CHERRY_CAMAIGN_NAME,CHERRY_TEMPLATE_ID,CHERRY_DTMF,CHERRY_BASEID,CHERRY_WELCOMEPID,CHERRY_MENUPID,CHERRY_NOINPUTPID
  ,CHERRY_WRONGINPUTPID,
  CHERRY_THANKSPID,
  CHERRY_SCHEDULETIME,
  CHERRY_SMSSUCCESSAPI,
  CHERRY_SMSFAILAPI,
  CHERRY_SMSDTMFAPI,
  CHERRY_CALLDURATIONSMS,
  CHERRY_RETRIES,
  CHERRY_RETRYINTERVAL,
  CHERRY_AGENTROWS,
  CHERRY_CHANNELS,
  CHERRY_MENUWAITTIME,
  CHERRY_REPROMPT
} from "../utils/utils.js";
import user from "../models/userModel.js";
import {
  convertAudioToWAV,
  checkAudioDuration,
  getDuration,
} from "../service/audioConverterService.js";
import { PassThrough } from "stream";
import wavInfo from "wav-file-info";
import fs from "fs";
import {
  calculateCreditsNeeded,
  hasSufficientCredits,
  deductCreditsAndUpdateUser,
} from "../service/credit_calculation_service.js";
import transactionHistory from "../models/transaction_model.js";
import moment from "moment";
import CallingNumber from "../models/dniModel.js";
import { resolveSrv } from "dns/promises";
ffmpeg.setFfprobePath(ffprobeStatic.path);

async function createObdCampaigning(req, res) {
  try {
    const token = req.headers.authorization;
    const { UserRole, UserId } = verifyToken(token);
  
    const audio = req.files["audioFile"][0];
    // const numberFile = req.files["numberFile"][0]
    const numberFile = req.files["numberFile"] && req.files["numberFile"][0] ? req.files["numberFile"][0] : 0;
    const SendmanualNumbers = req.body.numbers;
    const orignalName = audio.originalname;
    const buffer = req.files["audioFile"][0].buffer;
    const audioBuffer = audio.buffer;

    
    let validNumbers

    const numberBuffer = req.files["numberFile"] && req.files["numberFile"][0] ? req.files["numberFile"][0] : 0;
    const { CampaigName, description } = req.body;
    
      const csvBuffer = numberBuffer?.buffer;
      const csvString = csvBuffer?.toString("utf-8");

      const cleanAndValidatePhoneNumber = (number) => {
        const cleanedNumber = number.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        const mobileNumberRegex = /^[6-9]\d{9}$/;
        // Mobile number regex
      
        return mobileNumberRegex.test(cleanedNumber) ? cleanedNumber : null;
      };
      const phoneNumbers = (csvString?.split("\n") ?? [])
    .map((row) => row.trim())
    .filter((row) => row !== "" && row !== "Numbers");

 validNumbers = (phoneNumbers ?? [])
    .map(cleanAndValidatePhoneNumber)
    .filter((number) => number !== null); 
    console.log("SendmanualNumbers",validNumbers);
  const numberList = SendmanualNumbers.split('\n').map(num => num.trim());
  const validSendNumbers = [];
  const invalidNumbers = [];
  numberList.forEach(num => {
    // Validate each number (e.g., check if it's a valid 10-digit number)
    if (/^\d{10}$/.test(num)) {
      validSendNumbers.push(num);
    } else {
      invalidNumbers.push(num);
    }
  });
    
    console.log("validNumbers",validNumbers)


   let cleanedPhoneNumber
  const finalNumbersToSend = validNumbers && validNumbers.length > 0 ? validNumbers : validSendNumbers;
console.log("validSendNumbers",finalNumbersToSend);
  if (finalNumbersToSend === validSendNumbers) {
  
    cleanedPhoneNumber =validSendNumbers;
  } else {

    cleanedPhoneNumber = validNumbers;
  }


  console.log("@@@@@@@@",cleanedPhoneNumber);

    const outputFilePath = "obdUploads/sample.wav";
    await checkAudioDuration(audioBuffer, outputFilePath)
      .then(() => {
        console.log("Conversion completed.");
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    const audioMetadata = await getDuration(outputFilePath)
      .then((duration) => {
        fs.unlinkSync(outputFilePath)
        return duration;
      })
      .catch((error) => {
        console.error(`Error: ${error}`);
      });
                const calculatedDuration = audioMetadata
               const senderNumber=cleanedPhoneNumber.length
               const creditsNeeded = calculateCreditsNeeded(calculatedDuration);
               const totalCredit=senderNumber*creditsNeeded
               const userInfo = await user.findOne({ _id:UserId });
               let campaign_ID
              //  if(!(userInfo.role === "admin")){
                console.log("credfit",userInfo.credits,creditsNeeded);
                if(userInfo.credits <= creditsNeeded){ 
                  return  res.status(500).json({ message: 'You need to add more credit for this campaign' });
                } 
                   const updatedCredits = userInfo.credits - totalCredit;
                
                  await user.updateOne({_id: UserId }, { $set: { credits: updatedCredits } });
                  const deductCredit= `-${totalCredit}`
                  const currentDate = new Date();

                  const transaction=  await transactionHistory.create({
                    creditAction:deductCredit,
                    remarks:"Campaign",
                    date:currentDate,
                    time:moment(currentDate).format('h.mm A'),
                    addedBy:"-",
                    balance:updatedCredits,
                    UserId:UserId
                  })
                    

                  const saveObdCampaign = await obdCampaignModel.create({
                    obdcampaignname: CampaigName,
                    description,
                    createdBy: UserId,
                    role: UserRole,
                    audio: {
          filename: orignalName,
          data: buffer,
        },
        numbers: cleanedPhoneNumber,
      });
     campaign_ID = saveObdCampaign._id;

     const transaction_Id= transaction._id
     const update_id= await transactionHistory.findByIdAndUpdate(
      transaction_Id,
      { campaign_id: campaign_ID },
      { new: true }
     )
console.log("updata_id",update_id);

              
                
             




    if (cleanedPhoneNumber.length < 50) {
      const existingWhitelist = await whiteList.findOne({ createdBy: UserId });
      if (existingWhitelist) {
        const updatedNumbers = [
          ...existingWhitelist.numbers,
          ...cleanedPhoneNumber,
        ];
        const uniqueNumbers = Array.from(new Set(updatedNumbers));
        await whiteList.updateOne(
          { _id: existingWhitelist._id },
          { $set: { numbers: uniqueNumbers } }
        );
      } else {
        const savedWhitelist = new whiteList({
          campaign_id: campaign_ID._id,
          numbers: cleanedPhoneNumber,
          createdBy: UserId,
        });
        await savedWhitelist.save();
      }
    }

    const getCutting = await user.findOne({ _id: UserId });
    const userCuttingPercentage = getCutting.cutting_percentage;
    const whitelistCompare = await whiteList.findOne({ createdBy: UserId });
    const whitelistCompareNumbers = (whitelistCompare?.numbers ?? 0) || 0;
    const matchingNumbers = cleanedPhoneNumber.filter((number) =>
    whitelistCompareNumbers === 0 || whitelistCompareNumbers.includes(number));
    const matching = cleanedPhoneNumber.filter((number) =>
      matchingNumbers.includes(number)
    );
    const remainingNumbers = cleanedPhoneNumber.filter(
      (number) => !matchingNumbers.includes(number)
    );
    const cuttingCount = Math.ceil(
      (userCuttingPercentage / 100) * remainingNumbers.length
    );


    const filteredNumber = remainingNumbers.slice(cuttingCount);
    const finalSubmissionNumber = matching.concat(filteredNumber);
    console.log("length",finalSubmissionNumber);

    await obdCampaignModel.findByIdAndUpdate(
      campaign_ID,
      { sendingNumber_length: finalSubmissionNumber.length },
      { new: true }
    );
    const campaign_data = await obdCampaignModel.findById(campaign_ID);
    const obd_campaign_date = new Date(campaign_data.createdAt);
    const YEAR = obd_campaign_date.getFullYear();
    const MONTH = String(obd_campaign_date.getMonth() + 1).padStart(2, "0");
    const DAY = String(obd_campaign_date.getDate()).padStart(2, "0");

    const handleCherryCampaignCreation = async () => {
      const username= process.env.CHERRY_USERNAME
const password=process.env.CHERRY_PASSWORD
const loginData= await cherryLogin(username,password)
const userID= loginData.userid
const token=loginData.token
const promtC="welcome"
const audioFileName=CampaigName
const composeVoice= await uploadVoice(userID,promtC,audioFileName,token)
const pId= composeVoice.promptId
const baseName= CampaigName

const composeBaseLoad= await uploadBaseload(userID,baseName,token,finalSubmissionNumber)
const baseID=composeBaseLoad.baseId

const composeCampaignBaseLoad={
  [CHERRY_USER_ID]:userID,
  [CHERRY_CAMAIGN_NAME]:baseName,
  [CHERRY_TEMPLATE_ID]:"0",
  [CHERRY_DTMF]:"",
  [CHERRY_BASEID]:baseID,
  [CHERRY_WELCOMEPID]:pId,
  [CHERRY_MENUPID]:"",
  [CHERRY_NOINPUTPID]:"",
  [CHERRY_WRONGINPUTPID]:"",
  [CHERRY_THANKSPID]:"",
  [CHERRY_SCHEDULETIME]:`${YEAR}-${MONTH}-${DAY} 09:00:00`,
  [CHERRY_SMSSUCCESSAPI]:"",
  [CHERRY_SMSFAILAPI]:"",
  [CHERRY_SMSDTMFAPI]:"",
  [CHERRY_CALLDURATIONSMS]:"20",
  [CHERRY_RETRIES]:"0",
  [CHERRY_RETRYINTERVAL]:"0",
  [CHERRY_AGENTROWS]:"",
  [CHERRY_CHANNELS]:"20",
  [CHERRY_MENUWAITTIME]:"",
  [CHERRY_REPROMPT]:"0"
}


const compose_campaign_baseload = await composeCampaign(composeCampaignBaseLoad, token);

if (compose_campaign_baseload.status === 200) {
  return res.status(200).json({ message: "Campaign created successfully" });
} else {
  return res.status(500).json({ message: "Failed to create campaign" });
} 
 };

    const handleOBDCampaignCreation = async () => {
      const username = process.env.OBD_USERNAME;
      const password = process.env.OBD_PASSWORD;
      const authtoken = await obdLogin(username, password);
      
      const suffelNumbers = await CallingNumber.find();
      const dniNumbers = suffelNumbers.map(doc => doc.number);
      console.log("DNI NUmber List",dniNumbers.length);
      // Randomly select a number from the shuffled numbers
      const randomIndex = Math.floor(Math.random() * dniNumbers.length);
      console.log("randomIndex  List",randomIndex);
     const  cID= campaign_data._id.toString()
      const dniSendNumber = dniNumbers[randomIndex];  
      console.log("DNI",dniSendNumber);
          const formatedDate = `${YEAR}-${MONTH}-${DAY}`;
          const campaignData = {
            [OBD_CAMPAIGN_NAME]: cID,
            [OBD_CAMPAIGN_DESCRIPTION]: campaign_data.description,
            [OBD_CAMPAIGN_TYPE]: "3",
            [OBD_DNI]: `${dniSendNumber}`,
            [FROM_DATE]: formatedDate, 
            [TO_DATE]: formatedDate,
            [FROM_TIME]: "07:00:00",
            [TO_TIME]: "21:00:00",
            [DIAL_TIMEOUT]: "30",
            [RETRY_INTERVAL_TYPE]: "0",
            [RETRY_INTERVAL_VALUE]: "0",
            [RETRY_COUNT]: "0",
            [API_REQUEST]: "Y",
            [PING_BACK_URL]: "https://calls.ostpl.com/obd/getdata",
            [WELCOME_PROMPT]: "N",
            [DTMF_REQUEST]: "N",
            [DTMF_LENGTH]: "N",
            [DTMF_RETRY]: "2",
            [RETRY_LIMIT_EXCEEDED_PROMPT]: "N",
            [THANKS_PROMPT]: "N",
          };
      
          const createCampaign = await createOBDCampaign(authtoken, campaignData,campaign_ID);
      console.log("Campiagn payload",campaignData);
          const obd_campaignId = createCampaign;
          const obdNumberData = {
            [OBD_CAMPAIGN_ID]: obd_campaignId,
            [OBD_DNI]: dniSendNumber,
            numberFile: finalSubmissionNumber,
          };
          console.log("Obd campiagn created successfully");
      
          await uploadObdMedia(authtoken, campaign_ID, obd_campaignId);
          console.log("voice file uploaded");
      
          await uploadOBDNumber(authtoken, obdNumberData);
          console.log("Number file uploaded");
          await startOBD(authtoken, obd_campaignId);
          console.log("campiagn start sucessfully");
          return res.status(200).json({ message: "Campaign created successfully" });
    };

    let response;
    if (cleanedPhoneNumber.length < 1) {
      response = await handleCherryCampaignCreation();
    } else {
      response = await handleOBDCampaignCreation();
    }

    // Send response to the client based on the response received
    // if (response.status === 200) {
    //   return res.status(200).json({ message: "Campaign created successfully" });
    // } else {
    //   return res.status(500).json({ message: "Failed to create campaign" });
    // }
    } catch (error) {
      console.error("Error while composing campaign", error);
      return res.status(500).json({ message: "Error while composing campaign", error: error.message });
    }
}


export { createObdCampaigning };
