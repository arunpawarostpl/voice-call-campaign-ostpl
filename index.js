import express from 'express'
import dotenv from "dotenv"
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import cors from 'cors'
import helmet from 'helmet'
import userRoute from './src/routes/userRoute.js'
import obdroute from './src/routes/obdroute.js'
import path from "path"

// index.js or app.js
// import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development' });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
}
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
const PORT = process.env.PORT || 3000
// let PORT;

// if (process.env.NODE_ENV === 'development') {
//   PORT = process.env.development.PORT || 3000; // Use a default port (e.g., 3000) if PORT is not specified
// } else if (process.env.NODE_ENV === 'production') {
//   PORT = process.env.production.PORT || 80; // Use a default port (e.g., 80) if PORT is not specified
// }
// console.log('MongoDB Connection String:', process.env.MONGO);
// console.log('Loaded Environment Variables:', process.env);
mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Enviroment:${process.env.NODE_ENV}  Server Port:${process.env.PORT}`));
  })
  .catch((error) => console.error(`Failed to connect to MongoDB: ${error}`));

