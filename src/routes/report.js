import express from "express";

const router = express.Router();
import ApiHit from "../models/report.js";

router.post('/hit', async (req, res) => {
    try {
      // Find the existing count or create a new record if not exists
      let apiHit = await ApiHit.findOne();
  
      if (!apiHit) {
        apiHit = new ApiHit();
      }
  
      // Increment the count and save in the database
      apiHit.count++;
      await apiHit.save();
  
      // Log the API hit
      console.log('API Hit Count:', apiHit.count);
  
      // Respond with success
      res.status(200).json({ message: 'API Hit recorded successfully.', count: apiHit.count });
    } catch (error) {
      console.error('Error recording API hit:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
export default router
