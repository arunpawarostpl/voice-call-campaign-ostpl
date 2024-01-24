import express from 'express'
import dotev from 'dotenv'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import userRoute from './src/routes/userRoute.js'
import obdroute from './src/routes/obdroute.js'


dotev.config()
const app = express()
app.use(express.json())
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))

app.use('/', userRoute)
app.use('/obd', obdroute)

const PORT = process.env.PORT || 8000

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

