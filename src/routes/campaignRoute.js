import express from 'express'
import multer from 'multer'
const router = express.Router()
import { createCampaign } from '../controller/campaignController.js'
import Campaign from '../models/campaignModel.js'

const upload = multer({ storage: multer.memoryStorage() })  
// const upload = multer({ dest: 'audio_uploads/' })


//Create campaign
router.post('/create-campaign', upload.single('file'), async (req, res) => {
  try {
    await createCampaign(req, res)
  } catch (error) {
    console.error('Route error:', error)
    res.status(500).json({ message: 'Route error', error: error.message })
  }
})

router.get('/total-campiagn', async (req, res) => {
  try {
    const campaignCount = await Campaign.countDocuments({})
    // console.log('campaign Count:', campaignCount)
    res.json({ length: campaignCount })
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.get('/getCampaign', async (req, res) => {
  try {
    const getCamapaignList = await Campaign.find({}).select('-audio.data')
    // console.log('Camaign List', getCamapaignList)
    res.json(getCamapaignList)
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
