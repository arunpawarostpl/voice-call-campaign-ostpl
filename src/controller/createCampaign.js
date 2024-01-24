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
    const csvBuffer = numberBuffer.buffer;
    const csvString = csvBuffer.toString('utf-8');
const phoneNumbers = csvString
  .split('\n')
  .map(row => row.trim())
  .filter(row => row !== '' && row !== 'Numbers');
    if (!orignalName) {
      throw new Error('No audio file uploaded')
    }
    if (!numberFile && manualNumbers) {
      throw new Error('No Manual or number file uploaded')
    }

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
      [FROM_TIME]: '09:00:00',
      [TO_TIME]: '21:00:00',
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

    const obd_campaignId = createCampaign
    console.log("Obd_campaign Id",obd_campaignId);
    const obdId = obd_campaignId.campaign_ID
    console.log("obdId",obdId);
    const obdNumberData = {
      [OBD_CAMPAIGN_ID]: obd_campaignId,
      [OBD_DNI]: '9828011578',
      numberFile: saveObdCampaign.numbers
    }
    console.log("Obd campiagn created successfully");

     await uploadObdMedia(
      authtoken,
      campaign_ID,
      obd_campaignId
    )
    console.log('voice file uploaded')

     await uploadOBDNumber(
      authtoken,
      obdNumberData
    )
    console.log('Number file uploaded')
    await startOBD(authtoken, obd_campaignId)
    console.log("campiagn start sucessfully");
    return res.status(200).json({ message: 'Campaign created successfully' })
   
  } catch (error) {}
}



export { createObdCampaigning}
