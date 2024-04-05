import mongoose from 'mongoose'

const obdcampaignchema = new mongoose.Schema(
  {
    obdcampaignname: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    audio: {
      filename: { type: String, required: true },
      data: Buffer
    },
    createdBy: {
      type:String,
      ref: 'User',
      required: true
    },
    role: { type: String },
    numbers: [{ type: String, required: true }],
    campaign_Type: {
      type: String,
      enum: ['Transactional', 'test2'],
      default: 'Transactional'
    },
    campaign_ref_Id:{
      type:String
    },
    sendingNumber_length:{
      type:Number,
      default: 0
    }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
)

const obdCampaignModel = mongoose.model('obdcampaign', obdcampaignchema)

export default obdCampaignModel
