import obdCampaignModel from "../models/obdCampaign.js";
import transactionHistory from "../models/transaction_model.js";
import user from "../models/userModel.js";
import whiteList from "../models/whiteListModel.js";
import { checkAudioDuration, getDuration } from "./audioConverterService.js";
import { calculateCreditsNeeded } from "./credit_calculation_service.js";
import { generateUserCSV } from "./reportService.js"
import fs from "fs";
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
import { createOBDCampaign, obdLogin, startOBD, uploadOBDNumber, uploadObdMedia } from "./obdService.js";
import CallingNumber from "../models/dniModel.js";
import moment from "moment";




async function processCampaignData(campaignRefId, type) {
    try {
        const numbers = await generateUserCSV(campaignRefId);

        let rePushSendNumberdata;

        switch (type) {
            case "all":
                rePushSendNumberdata = numbers.map(item => item.A_PARTY_NO);
                break;
            case "answered":
                rePushSendNumberdata = numbers.filter(item => item.A_DIAL_STATUS === 'Connected').map(item => item.A_PARTY_NO);
                break;
            case "unanswered":
                rePushSendNumberdata = numbers.filter(item => item.A_DIAL_STATUS === 'User Not Responding').map(item => item.A_PARTY_NO);
                break;
                case "Timeout":
                    rePushSendNumberdata = numbers.filter(item => item.A_DIAL_STATUS === 'Timeout').map(item => item.A_PARTY_NO);
                    break;
            default:
                throw new Error("Invalid type: " + type);
        }

        console.log("rePushSendNumber:", rePushSendNumberdata);
        return rePushSendNumberdata;
    } catch (error) {
        console.error("Error processing campaign data:", error);
        throw error; 
    }
}







async function rePush(req,res){

    
    const {campaignRefId,type,createdById } = req.body;
    


const campaignDetails= await obdCampaignModel.findOne({campaign_ref_Id:campaignRefId})
const audioBuffer= campaignDetails.audio.data
const repushCampaignName=campaignDetails.obdcampaignname
const repushAudioFilename=campaignDetails.audio.filename
const repushUserRole=campaignDetails.role
const repushCampaignDescription=campaignDetails.description

console.log(repushAudioFilename);


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
console.log("audioMetadata",audioMetadata);




    try {
        console.log(campaignRefId,type);
     const numbers= await generateUserCSV(campaignRefId)
console.log("numbers",numbers);
const rePushSendNumber=await processCampaignData(campaignRefId, type)
   

console.log("@@@@",rePushSendNumber);

const calculatedDuration = audioMetadata
const senderNumber=rePushSendNumber.length
const creditsNeeded = calculateCreditsNeeded(calculatedDuration);
const totalCredit=senderNumber*creditsNeeded
const userInfo = await user.findOne({ _id:createdById });
console.log("credfit",userInfo.credits,creditsNeeded);
console.log("credfit",userInfo.credits,
);

                 if(userInfo.credits <= creditsNeeded){ 
                  return  res.status(500).json({ message: 'You need to add more credit for this campaign' });
                } 
                const updatedCredits = userInfo.credits - totalCredit;
                     
                     await user.updateOne({_id: createdById }, { $set: { credits: updatedCredits } });
                  const deductCredit= `-${totalCredit}`
                  const currentDate = new Date();
                  console.log("user",createdById);
                  try {
                    const transaction = await transactionHistory.create({
                      creditAction: deductCredit,
                      remarks: "Repush-Campaign",
                      date: currentDate,
                      time: moment(currentDate).format('h.mm A'),
                      addedBy: "-",
                      balance: updatedCredits,
                      UserId: createdById[0]
                    });
                  
                    console.log("Transaction created:", transaction);

                    
                  } catch (error) {
                    console.error("Error creating transaction:", error);
                    // Handle the error appropriately (e.g., log it, send an error response)
                    return res.status(500).json({ message: 'Failed to create transaction' });
                  }

                  try {
                    const saveObdCampaign = await obdCampaignModel.create({
                        obdcampaignname: `Re-push-${repushCampaignName}`,
                        description:repushCampaignDescription,
                        createdBy: createdById[0],
                        role: repushUserRole,
                        audio: {
              filename: repushAudioFilename,
              data: audioBuffer,
            },
            numbers: rePushSendNumber,
          });

          const campaign_ID = saveObdCampaign._id;



          const getCutting = await user.findOne({ _id: createdById });
          const userCuttingPercentage = getCutting.cutting_percentage;
          const whitelistCompare = await whiteList.findOne({ createdBy: createdById });
          const whitelistCompareNumbers = (whitelistCompare?.numbers ?? 0) || 0;
          const matchingNumbers = rePushSendNumber.filter((number) =>
          whitelistCompareNumbers === 0 || whitelistCompareNumbers.includes(number));
          const matching = rePushSendNumber.filter((number) =>
            matchingNumbers.includes(number)
          );
          const remainingNumbers = rePushSendNumber.filter(
            (number) => !matchingNumbers.includes(number)
          );
          const cuttingCount = Math.ceil(
            (userCuttingPercentage / 100) * remainingNumbers.length
          );
      
      
          const filteredNumber = remainingNumbers.slice(cuttingCount);
          const finalSubmissionNumber = matching.concat(filteredNumber);

          await obdCampaignModel.findByIdAndUpdate(
              campaign_ID,
              { sendingNumber_length: finalSubmissionNumber.length },
              { new: true }
            )

            const campaign_data = await obdCampaignModel.findById(campaign_ID);
            const obd_campaign_date = new Date(campaign_data.createdAt);
            const YEAR = obd_campaign_date.getFullYear();
            const MONTH = String(obd_campaign_date.getMonth() + 1).padStart(2, "0");
            const DAY = String(obd_campaign_date.getDate()).padStart(2, "0");


          //   const handleOBDCampaignCreation = async () => {
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

                  } catch (error) {
                    console.error("Error creating transaction:", error);
                    return res.status(500).json({ message: 'Failed to create transaction' });
                  }



    } catch (error) {
        
    }
  }


  export {rePush}