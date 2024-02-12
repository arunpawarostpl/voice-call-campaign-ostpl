import express from 'express'
import dotenv from "dotenv"
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import userRoute from './src/routes/userRoute.js'
import obdroute from './src/routes/obdroute.js'
import reportroute from "./src/routes/report.js"
import path from "path"
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



app.use('/', userRoute)
app.use('/obd', obdroute)
app.use('/api',reportroute)
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

