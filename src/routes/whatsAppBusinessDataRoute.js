import express from 'express';
const router = express.Router();
import {addOrUpdateWhatsAppBusinessData, getData} from '../controller/whatsAppBusinessDataController.js';

router.post('/', async (req, res) => {
  try {
    await addOrUpdateWhatsAppBusinessData(req, res)
  } catch (error) {
    console.error('Route error:', error)
    res.status(500).json({ message: 'Route error', error: error.message })
  }
})
router.get('/', async (req, res) => {
  try {
    await getData(req, res)
  } catch (error) {
    console.error('Route error:', error)
    res.status(500).json({ message: 'Route error', error: error.message })
  }
})
export default  router