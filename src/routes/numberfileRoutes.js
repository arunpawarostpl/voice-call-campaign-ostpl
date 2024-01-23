import express from 'express'
import multer from 'multer'
import { uploadAudio } from '../controller/numberfileController.js'

const router = express.Router()

const upload = multer({ dest: 'audio_uploads/' })

//upload audio
router.post(
  '/upload-audio/:campaignId',
  upload.single('file'),
  async (req, res) => {
    try {
      await uploadAudio(req, res)
    } catch (error) {
      console.error('Route error:', error)
      res.status(500).json({ message: 'Route error', error: error.message })
    }
  }
)
export default router
