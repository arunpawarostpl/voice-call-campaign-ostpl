import audio from "../models/audioModel";
import { verifyToken } from "../validator/authService";

const getList =async(req,res)=>{
    try {
    const token = req.headers.authorization;
    const { UserId } = verifyToken(token);
    const findAudio= await audio.find({createdBy:UserId})
    if(!findAudio){
        return res.status(200).json({message:"Audio Not Found"})
    }
    return res.send(findAudio)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}




export {getList}