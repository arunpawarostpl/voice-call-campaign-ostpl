// services/facebookService.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import WatsappMedia from "../models/bussinessMediaModel.js";


const uploadWhatsappMedia = async (file, type, token) => {
    try {
       
        const form = new FormData();
    form.append('file', fs.createReadStream(`Uploads/${file.filename}`));
    form.append('messaging_product','whatsapp')
    console.log('File appended to FormData:', 
       form.getHeaders()
    );
        const headers = {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          };
        const response = await axios.post(
            'https://graph.facebook.com/v19.0/208475342358734/media',
            form,
            {
                headers: {
                  ...form.getHeaders(), 
                  ...headers,
                },
              }
        );

        const { id } = response.data;
        console.log(id);
        fs.unlinkSync(`Uploads/${file.filename}`);
        return id;
    } catch (error) {
        console.error('Error uploading media to Facebook:', error.response?.data || error.message);
    throw new Error('Error uploading media to Facebook');
    }
};  


const sendMessage = async (media, token) => {
    try {
        const mediaId = media._id;

        // Find media details based on _id
        const findMedia = await WatsappMedia.findOne({ _id: mediaId });
        if (!findMedia) {
            throw new Error('Media not found');
        }
        const sendingMediaId=findMedia.mediaId
        const templateName = findMedia.template_name;
        const numbers = findMedia.numbers;
        const mediaType = findMedia.type;

        // Prepare the API payload for each recipient
        for (const recipientNumber of numbers) {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: `91${recipientNumber}`,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'en'
                    },
                    components: [
                        {
                            type: 'header',
                            parameters: [
                                {
                                    type: mediaType,
                                    [mediaType]: {
                                        id: sendingMediaId
                                    }
                                }
                            ]
                        }
                    ]
                }
            };

            console.log("payload",JSON.stringify(payload));
            // Configure axios request
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            };
const url="https://graph.facebook.com/v19.0/208475342358734/messages"
            const response = await axios.post(url, payload, { headers });
            console.log(`Message sent successfully to ${recipientNumber}:`, response.data);
        }
    } catch (error) {
        console.error('Error sending messages:', error.message);
      
    }
};




export { uploadWhatsappMedia,sendMessage };
