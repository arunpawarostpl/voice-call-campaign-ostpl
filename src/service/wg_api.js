async function uploadVoice(userID,promtC,audioFileName,token){

    const userid=userID
    const fileName=audioFileName
    const promtCategory= promtC
    console.log("data",userid,fileName,promtCategory);
    try {
        const form = new FormData();
     
        form.append('file', fileName);
        
        const headers = {
             // Added space after 'Bearer'
            "Content-Type": "multipart/form-data",
          };
          const url=process.env.WG_UPLOAD_VOICE
          const response = await axios.post(url,form,{headers: {
            ...form.getHeaders(), 
            ...headers,
          }})
          const baseLoadresponse= response.data
        console.log("data", baseLoadresponse);

        return baseLoadresponse
    } catch (error) {
        console.error("Error while uploading VoiceFile", error);
        throw error; 
    }
}
