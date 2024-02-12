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
ffmpeg.setFfprobePath(ffprobeStatic.path);

async function createObdCampaigning(req, res) {
  try {
    const token = req.headers.authorization;
    const { UserRole, UserId } = verifyToken(token);
    const audio = req.files["audioFile"][0];
    const numberFile = req.files["numberFile"][0];
    const manualNumbers = req.body.number;
    const orignalName = audio.originalname;
    const buffer = req.files["audioFile"][0].buffer;
    const numberBuffer = req.files["numberFile"][0];
    const { CampaigName, description } = req.body;
    const csvBuffer = numberBuffer.buffer;
    const csvString = csvBuffer.toString("utf-8");
    const audioBuffer = audio.buffer;
    console.log("Audio details", audio);

    const phoneNumbers = csvString
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row !== "" && row !== "Numbers");
    if (!orignalName) {
      throw new Error("No number file uploaded");
    }
    if (!numberFile && manualNumbers) {
      throw new Error("No Manual or number file uploaded");
    }

    const cleanedPhoneNumber = phoneNumbers.map((number) =>
      number.replace(/ /g, "")
    );

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
        fs.unlinkSync(outputFilePath);
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
         if(!userInfo.role==="admin"){
console.log("Userinfo",userInfo);
               if(userInfo.credits >= creditsNeeded){
                const updatedCredits = userInfo.credits - totalCredit;
                await user.updateOne({_id: UserId }, { $set: { credits: updatedCredits } });
               }else{
                console.error("error")
               }}


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
    const campaign_ID = saveObdCampaign._id;
    if (cleanedPhoneNumber.length < 20) {
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
    const whitelistCompareNumbers = whitelistCompare.numbers || 0;

    const matchingNumbers = cleanedPhoneNumber.filter((number) =>
      whitelistCompareNumbers.includes(number)
    );

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

    const username = process.env.OBD_USERNAME;
    const password = process.env.OBD_PASSWORD;
    const authtoken = await obdLogin(username, password);
    const campaign_data = await obdCampaignModel.findById(campaign_ID);
    const obd_campaign_date = new Date(campaign_data.createdAt);
    const YEAR = obd_campaign_date.getFullYear();
    const MONTH = String(obd_campaign_date.getMonth() + 1).padStart(2, "0");
    const DAY = String(obd_campaign_date.getDate()).padStart(2, "0");

    const formatedDate = `${YEAR}-${MONTH}-${DAY}`;
    const campaignData = {
      [OBD_CAMPAIGN_NAME]: campaign_data._id,
      [OBD_CAMPAIGN_DESCRIPTION]: campaign_data.description,
      [OBD_CAMPAIGN_TYPE]: "3",
      [OBD_DNI]: "9828011578",
      [FROM_DATE]: formatedDate,
      [TO_DATE]: formatedDate,
      [FROM_TIME]: "09:00:00",
      [TO_TIME]: "21:00:00",
      [DIAL_TIMEOUT]: "30",
      [RETRY_INTERVAL_TYPE]: "0",
      [RETRY_INTERVAL_VALUE]: "2",
      [RETRY_COUNT]: "4",
      [API_REQUEST]: "Y",
      [PING_BACK_URL]: "https://calls.ostpl.com/obd/getdata",
      [WELCOME_PROMPT]: "N",
      [DTMF_REQUEST]: "N",
      [DTMF_LENGTH]: "N",
      [DTMF_RETRY]: "2",
      [RETRY_LIMIT_EXCEEDED_PROMPT]: "N",
      [THANKS_PROMPT]: "N",
    };

    const createCampaign = await createOBDCampaign(authtoken, campaignData);

    const obd_campaignId = createCampaign;
    console.log("Obd_campaign Id", obd_campaignId);
    const obdNumberData = {
      [OBD_CAMPAIGN_ID]: obd_campaignId,
      [OBD_DNI]: "9828011578",
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
  } catch (error) {
    
  }
}
export { createObdCampaigning };
