import mongoose from 'mongoose'

const campaignSchema = new mongoose.Schema(
  {
    campaignName: {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: { type: String },
    campaign_Type: {
      type: String,
      enum: ['Transactional', 'test2'],
      default: 'Transactional'
    }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
)

const Campaign = mongoose.model('Campaign', campaignSchema)

export default Campaign