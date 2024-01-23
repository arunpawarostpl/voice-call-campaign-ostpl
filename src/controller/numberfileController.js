// Import the convertToWav function
import Campaign from '../models/campaignModel.js'
import numberfile from '../models/numberFileModel.js'
import { ObjectId } from 'mongodb'
import { verifyToken } from '../validator/authService.js'
import {
  createOBDCampaign,
  obdLogin,
  uploadOBDNumber,
  uploadObdMedia,
  startOBD
} from '../service/obdService.js'
// import { generateExcel } from '../service/fileUploadService.js';
import {
  handleCSVUpload,
  handleExcelUpload,
  deleteFile
} from '../service/fileUploadService.js'
import whiteList from '../models/whiteListModel.js'
import xlsx from 'xlsx'
import fs from 'fs'
import numbefile from '../models/numberFileModel.js'
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

async function uploadAudio (req, res) {
  try {
    const token = req.headers.authorization
    const { UserId } = verifyToken(token)
    const campaignId = req.query.campaignId
    // console.log(campaignId);

    const isCampaignValid = await isValidCampaignId(campaignId)

    if (!isCampaignValid) {
      throw new Error('Invalid campaign ID')
    }

    if (!req.file) {
      throw new Error('No audio file uploaded')
    }

    let numbers = []
    if (req.file) {
      if (req.file.mimetype === 'text/csv') {
        numbers = await handleCSVUpload(req)
      } else if (
        req.file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        numbers = handleExcelUpload(req)
      } else {
        return res.status(400).json({ message: 'Unsupported file format' })
      }

      console.log('@@@@@', numbers.length)

      const savedCampaign = new numberfile({
        campaign_id: campaignId,
        numbers,
        createdBy: UserId
      })

      const newCampaign = await savedCampaign.save()

      if (numbers.length < 10) {
        const whiteListing = new whiteList({
          campaign_id: newCampaign._id,
          numbers,
          createdBy: UserId
        })
         await whiteListing.save()
      }

      const username = ADMIN_USERNAME
      const password = ADMIN_PASSWORD

      const authtoken = await obdLogin(username, password)
      console.log(authtoken)
      const campaign_data = await Campaign.findById(campaignId)
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

      //Creating OBD campaign

      const createCampaign = await createOBDCampaign(authtoken, campaignData)

      const obd_campaignId = JSON.parse(createCampaign)
      const obdId = obd_campaignId.campaign_ID
      const obdNumberData = {
        [OBD_CAMPAIGN_ID]: obdId,
        [OBD_DNI]: '9828011578',
        numberFile: newCampaign.numbers
      }

      //Uploading Audio in OBD API

      const uploadMediaResponse = await uploadObdMedia(
        authtoken,
        campaignId,
        obdId
      )
      console.log('voice file uploaded')

      //Uploading Number file in OBD API

      const uploadNumberResponse = await uploadOBDNumber(
        authtoken,
        obdNumberData
      )
      console.log('Number file uploaded')

      // Initiate the OBD campaign

      const startObdResponse = await startOBD(authtoken, obdId)

      return res.json({
        Status: 'ok',
        status_code: 200,
        Message: 'Your Campaign has been started Shortly',
        campaignData: {
          createCampaign,
          uploadMediaResponse,
          uploadNumberResponse,
          startObdResponse
        }
      })
    }
  } catch (error) {
    console.error('Error uploading audio:', error)
    res
      .status(500)
      .json({ message: 'Error uploading audio', error: error.message })
  }
}

async function isValidCampaignId (campaignId) {
  try {
    const isValid = ObjectId.isValid(campaignId)
    if (!isValid) {
      return false
    }

    const campaign = await Campaign.findById(campaignId)

    return campaign ? true : false
  } catch (error) {
    console.error('Error validating campaign ID:', error)
    return false
  }
}

export { uploadAudio }
