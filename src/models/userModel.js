    import mongoose from 'mongoose';
    const { Schema } = mongoose;

    // Define a User schema
    const userSchema = new mongoose.Schema({
        username: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        email: { type: String, required: true, },
        password: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin', 'reseller'], required: true },
        cutting_percentage:{type:Number,default:0},
        credits: { type: Number, default: 0 },
        createdBy:{type:String,required:true},
        planType: [{
            type: Number, 
            required: true,
          }],
    }, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });


    const user=mongoose.model("user",userSchema )
    // Create User model
    export default user
