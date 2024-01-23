import {
  handleCSVUpload,
  handleExcelUpload,
  parseCSVBuffer
} from '../service/fileUploadService.js'
import { verifyToken } from '../validator/authService.js'
import obdCampaignModel from '../models/obdCampaign.js'
import whiteList from '../models/whiteListModel.js'
import fs from 'fs'
import { extname, parse } from 'path'
import { promisify } from 'util'
import csvParser from 'csv-parser'
import { createOBDCampaign, obdLogin, startOBD, uploadOBDNumber, uploadObdMedia } from '../service/obdService.js'
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
  ADMIN_USERNAME,
  ADMIN_PASSWORD
} from '../utils/utils.js'
import { Stream } from 'stream'
// import csvParser from 'csv-parser'






async function createObdCampaigning (req, res) {
  try {
    const token = req.headers.authorization
    const { UserRole, UserId } = verifyToken(token)
    const audio = req.files['audioFile'][0]
    const numberFile = req.files['numberFile'][0]
    const manualNumbers = req.body.number
    
    const orignalName = audio.originalname
    const buffer = req.files['audioFile'][0].buffer
    const numberBuffer=  req.files['numberFile'][0]
    const { CampaigName, description } = req.body
    
    console.log("buffer@@@@@@@@@",buffer);
    console.log("Numberbuffer@@@@@@@@@",numberBuffer);
    const csvBuffer = numberBuffer.buffer;
    const csvString = csvBuffer.toString('utf-8');
    console.log("@@@@@@@@",csvString);

const number=[]
const phoneNumbers = csvString
  .split('\n')
  .map(row => row.trim())
  .filter(row => row !== '' && row !== 'Numbers');
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@ Phone",phoneNumbers);




    if (!orignalName) {
      throw new Error('No audio file uploaded')
    }
    if (!numberFile && manualNumbers) {
      throw new Error('No Manual or number file uploaded')
    }



    // if (numberFile) {
    //   if (numberFile.mimetype === 'text/csv') {
    //     numbers = await handleCSVUpload(csvString)
    //   } else if (
    //     req.file.mimetype ===
    //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    //   ) {
    //     numbers = handleExcelUpload(req)
    //   } else {
    //     return res.status(400).json({ message: 'Unsupported file format' })
    //   }
    // }
    console.log('enter in funtion')

    const saveObdCampaign = await obdCampaignModel.create({
        obdcampaignname:CampaigName,
      description,
      createdBy: UserId,
      role: UserRole,
      audio: {
        filename: orignalName,
        data: buffer
      },
      numbers:phoneNumbers
    })
    // console.log("savedOBD",saveObdCampaign);

    // const obd = await saveObdCampaign.save()
    const campaign_ID = saveObdCampaign._id

    if (csvString.length < 10) {
      const savedWhitelisitng = new whiteList({
        campaign_id: campaign_ID._id,
        numbers,
        createdBy: UserId
      })
      await savedWhitelisitng.save()
    }

    const username = ADMIN_USERNAME
    const password = ADMIN_PASSWORD
    const authtoken = await obdLogin(username, password)
    const campaign_data = await obdCampaignModel.findById(campaign_ID)
    const obd_campaign_date = new Date(campaign_data.createdAt)
    const YEAR = obd_campaign_date.getFullYear()
    const MONTH = String(obd_campaign_date.getMonth() + 1).padStart(2, '0')
    const DAY = String(obd_campaign_date.getDate()).padStart(2, '0')

    const formatedDate = `${YEAR}-${MONTH}-${DAY}`
    const campaignData = {
      [OBD_CAMPAIGN_NAME]: campaign_data._id,
      [OBD_CAMPAIGN_DESCRIPTION]: campaign_data.description,
      [OBD_CAMPAIGN_TYPE]: '3',
      [OBD_DNI]: '9828011578',
      [FROM_DATE]: formatedDate,
      [TO_DATE]: formatedDate,
      [FROM_TIME]: '12:50:00',
      [TO_TIME]: '12:55:00',
      [DIAL_TIMEOUT]: '30',
      [RETRY_INTERVAL_TYPE]: '0',
      [RETRY_INTERVAL_VALUE]: '2',
      [RETRY_COUNT]: '4',
      [API_REQUEST]: 'N',
      [PING_BACK_URL]: 'N/a',
      [WELCOME_PROMPT]: 'N',
      [DTMF_REQUEST]: 'N',
      [DTMF_LENGTH]: 'N',
      [DTMF_RETRY]: '2',
      [RETRY_LIMIT_EXCEEDED_PROMPT]: 'N',
      [THANKS_PROMPT]: 'N'
    }

    const createCampaign = await createOBDCampaign(authtoken, campaignData)
    const obd_campaignId = JSON.parse(createCampaign)
    const obdId = obd_campaignId.campaign_ID
    const obdNumberData = {
      [OBD_CAMPAIGN_ID]: obdId,
      [OBD_DNI]: '9828011578',
      numberFile: saveObdCampaign.numbers
    }
    console.log("obd numbers", saveObdCampaign.numbers);

    console.log("Obd campiagn created successfully");

     await uploadObdMedia(
      authtoken,
      campaign_ID,
      obdId
    )
    console.log('voice file uploaded')

     await uploadOBDNumber(
      authtoken,
      obdNumberData
    )
    console.log('Number file uploaded')



    await startOBD(authtoken, obdId)
    console.log("campiagn start sucessfully");



  
    return res.status(200).json({ message: 'Campaign created successfully' })
   
  } catch (error) {}
}



export { createObdCampaigning}
