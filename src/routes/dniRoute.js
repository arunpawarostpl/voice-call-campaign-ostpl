import express from 'express';
const router = express.Router()
import {
  createCallingNumber,
  getAllCallingNumbers,
  updateCallingNumber,
  deleteCallingNumber,
  uploadDni
} from "../service/dni_service.js"
;
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: "numberFile", maxCount: 1 },
]);

router.post('/add-dni',async(req,res)=>{
    try { 
        
        await createCallingNumber(req, res);
      } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({ message: "Route error", error: error.message });
      }
});
router.get('/get-list',async(req,res)=>{
try { 
        
    await getAllCallingNumbers(req, res);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ message: "Route error", error: error.message });
  }});


  router.post('/upload-dni',cpUpload,async(req,res)=>{
    try { 
            
        await uploadDni(req, res);
      } catch (error) {
        console.error("Route error:", error);
        res.status(500).json({ message: "Route error", error: error.message });
      }});


      router.delete('/delete', async (req, res) => {
        console.log("@@@");
        try { 
          const { userId } = req.query;
          
          // Assuming deleteCallingNumber returns a boolean indicating success
          const deletionResult = await deleteCallingNumber(userId);
          console.log("asasa",deletionResult);
      
            res.json({ message: "Calling number deleted successfully" });
        } catch (error) {
          console.error("Route error:", error);
          res.status(500).json({ message: "Route error", error: error.message });
        }
      });
      
    

router.put('/:id', updateCallingNumber);



export default router;
