import express from 'express'
import multer from 'multer'
const router = express.Router()
import { createObdCampaigning } from '../controller/createCampaign.js'
import obdCampaignModel from '../models/obdCampaign.js'
import path from "path"

const upload = multer({ storage: multer.memoryStorage() })
// const numberUpload = multer({ dest: 'Number_uploads/' })
const cpUpload = upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'numberFile', maxCount: 1 }
])

// const customUpload = (req, res, next) => {
//   const audioFile = req.files && req.files['audioFile'][0];
//   const numberFile = req.files && req.files['numberFile'][0];

//   if (audioFile) {
//     console.log("audiofile",audioFile);
//     // If 'audioFile' exists, use the 'upload' multer instance
//     upload.any()(req, res, next);
//   } else if (numberFile) {
//     // If 'numberFile' exists, use the 'numberUpload' multer instance
//     numberUpload.any()(req, res, next);
//   } else {
//     // If neither 'audioFile' nor 'numberFile' exists, proceed to the next middleware
//     next();
//   }
// };


// const storage = multer.memoryStorage();

// const upload = multer({
//   storage: storage,
//   fileFilter: function (req, file, cb) {
//     const isAudioFile = file.fieldname === 'audioFile';
//     const isNumberFile = file.fieldname === 'numberFile';

//     if (isAudioFile) {
//       // Set the destination for audioFile
//       file.destination = 'audio_uploads/';
//     } else if (isNumberFile) {
//       // Set the destination for numberFile
//       file.destination = 'number_uploads/';
//     }

//     cb(null, true);
//   }
// });




// const audioStorage = multer.memoryStorage();
// const audioUpload = multer({ storage: audioStorage });


// const numberStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'number_uploads/');
//   }
// });


// const numberUpload = multer({ storage: numberStorage });


// const cpUpload = (req, res, next) => {
//   audioUpload.fields([{ name: 'audioFile', maxCount: 1 }])(req, res, (err) => {
//     if (err instanceof multer.MulterError) {
//       // Handle Multer errors
//       return res.status(400).json({ error: err.message });
//     } else if (err) {
//       // Handle other errors
//       return res.status(500).json({ error: err.message });
//     }

//     // If audioFile is uploaded, proceed to the next middleware
//     if (req.files['audioFile']) {
//       return next();
//     }

//     // If audioFile is not uploaded, handle numberFile
//     numberUpload.fields([{ name: 'numberFile', maxCount: 1 }])(req, res, (err) => {
//       if (err instanceof multer.MulterError) {
//         // Handle Multer errors
//         return res.status(400).json({ error: err.message });
//       } else if (err) {
//         // Handle other errors
//         return res.status(500).json({ error: err.message });
//       }

//       next(); // Proceed to the next middleware after handling numberFile
//     });
//   });
// };


router.post('/create-obd',  cpUpload, async (req, res) => {
  try {
      console.log('enter in api')
    await createObdCampaigning(req, res)
  } catch (error) {
    console.error('Route error:', error)
    res.status(500).json({ message: 'Route error', error: error.message })
  }
})

router.get('/getlist',async(req,res)=>{
  try {
    const list = await obdCampaignModel.find({}).select('-audio.data')
    // console.log('Camaign List', getCamapaignList)
    // console.log("Campaign data ====>",list);
    res.json(list)
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
