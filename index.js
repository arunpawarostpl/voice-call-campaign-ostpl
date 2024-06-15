import express from 'express'
import dotenv from "dotenv"
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import userRoute from './src/routes/userRoute.js'
import obdroute from './src/routes/obdroute.js'
import reportRoute from "./src/routes/report.js"
import path from "path"
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dniRoute from "./src/routes/dniRoute.js"
import mediaRoute from "./src/routes/mediaRoute.js"
import whatsAppBusinessDataRoute from "./src/routes/whatsAppBusinessDataRoute.js"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();



const app = express()
app.use(express.json())
app.use(bodyParser.json());
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.use('/files',express.static(path.join(__dirname,'public/files')))



app.use('/', userRoute)
app.use('/obd', obdroute)
app.use('/report',reportRoute)
app.use('/dni',dniRoute)
app.use('/upload', mediaRoute);
app.use('/wa-business-data', whatsAppBusinessDataRoute);




const PORT = process.env.PORT || 3000

mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server Port:${PORT}`));
  })
  .catch((error) => console.error(`Failed to connect to MongoDB: ${error}`));

