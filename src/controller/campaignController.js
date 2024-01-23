import {
  handleCSVUpload,
  handleExcelUpload,
  deleteFile
} from '../service/fileUploadService.js'
import { verifyToken } from '../validator/authService.js'
import Campaign from '../models/campaignModel.js'
import whiteList from '../models/whiteListModel.js'
// import { getAudioInfo,generateWaveFile ,saveAudioFromBase64} from '../service/audioConverterService.js'
import fs from 'fs'
import { extname, parse } from 'path'
import { promisify } from 'util'
import waveheader from 'waveheader'
// import wav from "wav"
// import lame from "lame"

async function createCampaign (req, res) {
  try {
    const token = req.headers.authorization
    const { UserRole, UserId } = verifyToken(token)
    console.log(UserRole, UserId)

    if (!req.file) {
      throw new Error('No audio file uploaded')
    }
    const { originalname, buffer } = req.file
    const { campaignName, description } = req.body
    const fileBuffer = req.file.buffer
    

    console.log('filebufffer', fileBuffer)
    const savedCampaign = await Campaign.create({
      campaignName,
      createdBy: UserId,
      role: UserRole,
      description,
      audio: {
        filename: originalname,
        data: fileBuffer // Save the audio file content as a buffer
      }
    })
    const campaign_ID = savedCampaign._id

    const filePath = 'obdUploads/WhatsApp001.wav'

    try {
      const wavBuffer = fs.readFileSync(filePath)

      // Parsing WAV header information manually
      const header = {
        // RIFF header
        chunkID: wavBuffer.toString('utf8', 0, 4),
        chunkSize: wavBuffer.readUInt32LE(4),
        format: wavBuffer.toString('utf8', 8, 12),

        // Format subchunk
        fmtSubchunkID: wavBuffer.toString('utf8', 12, 16),
        fmtSubchunkSize: wavBuffer.readUInt32LE(16),
        audioFormat: wavBuffer.readUInt16LE(20),
        numChannels: wavBuffer.readUInt16LE(22),
        sampleRate: wavBuffer.readUInt32LE(24),
        byteRate: wavBuffer.readUInt32LE(28),
        blockAlign: wavBuffer.readUInt16LE(32),
        bitsPerSample: wavBuffer.readUInt16LE(34),

        // Data subchunk
        dataSubchunkID: wavBuffer.toString('utf8', 36, 40),
        dataSubchunkSize: wavBuffer.readUInt32LE(40)
      }

      console.log('Audio Format:', header.audioFormat)
      console.log('Number of Channels:', header.numChannels)
      console.log('Sample Rate:', header.sampleRate)
      console.log('Byte Rate:', header.byteRate)
      console.log('Bits per Sample:', header.bitsPerSample)
    } catch (error) {
      console.error('Error:', error.message)
    }
    return res
      .status(200)
      .json({
        message: 'Campaign created successfully',
        campaign_ID: campaign_ID
      })
  } catch (error) {
    console.error('Error creating campaign:', error)
    res
      .status(500)
      .json({ message: 'Error creating campaign', error: error.message })
  }
}

export { createCampaign }
