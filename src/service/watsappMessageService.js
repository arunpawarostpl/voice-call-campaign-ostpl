// services/facebookService.js
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import WatsappMedia from "../models/bussinessMediaModel.js";
import { saveVideoFromBuffer } from "./fileUploadService.js";


async function uploadWhatsappMedia(token, media, buffer, wa_phone_id) {
  try {

    const mediaType = media.type;
    let mediaBuffer;
    let fileExtension;

    if (mediaType === 'video') {
      mediaBuffer = buffer;
      fileExtension = 'mp4';
    } else if (mediaType === 'document') {
      mediaBuffer = buffer;
      fileExtension = 'pdf';
    } else if (mediaType === 'image') {
      mediaBuffer = buffer;
      fileExtension = 'jpg';
    } else {
      throw new Error('Unsupported media type');
    }

    const form = new FormData();
    const filename = `${media.name}.${fileExtension}`;
    form.append('file', Buffer.from(mediaBuffer), { filename });
    form.append('messaging_product', 'whatsapp');

    const headers = {
      'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${wa_phone_id}/media`,
      form,
      { headers }
    );

    const { id } = response.data;
    return id;
  } catch (error) {
    console.error('Error uploading media to Facebook:', error.response?.data || error.message);
    throw new Error('Error uploading media to Facebook');
  }
}

const sendMessage = async (media, token, wa_phone_id, batchSize = 50) => {
  try {
    const mediaId = media._id;
    const findMedia = await WatsappMedia.findOne({ _id: mediaId });
    if (!findMedia) {
      throw new Error('Media not found');
    }


    const { mediaId: sendingMediaId, template_name: templateName, numbers, type: mediaType, language_code: lan_code, name: fileName } = findMedia;

    const numberBatches = [];
    for (let i = 0; i < numbers.length; i += batchSize) {
      numberBatches.push(numbers.slice(i, i + batchSize));
    }


    for (const batch of numberBatches) {
      if (!Array.isArray(batch)) {
        console.error('Invalid batch:', batch);
        continue; // Skip this batch and proceed to the next one
      }
      const payloadPromises = batch.map(async (recipientNumber) => {
        try {
          const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: `91${recipientNumber}`,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: lan_code
              },
              components: [
                {
                  type: 'header',
                  parameters: [
                    {
                      type: mediaType,
                      [mediaType]: {
                        id: sendingMediaId,
                        filename: fileName
                      }
                    }
                  ]
                }
              ]
            }
          };

          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          };

          console.log("payload", JSON.stringify(payload));
          const url = `https://graph.facebook.com/v19.0/${wa_phone_id}/messages`;
          const response = await axios.post(url, payload, { headers });


          const deliveryStatus = `Message sent successfully to ${recipientNumber}: ${response.status} ${response.statusText}`;
          numberBatches.push(deliveryStatus);

          return deliveryStatus;
        } catch (error) {

          console.error(`Error sending message to ${recipientNumber}:`, error.message);
          throw error;
        }
      });

      // Execute all payload promises for the current batch
      const results = await Promise.all(payloadPromises);

      // Log results for each message sent in the current batch
      results.forEach((result) => console.log(result));
    }

    console.log('All messages sent successfully.');

  } catch (error) {
    // Handle any general errors during message sending
    console.error('Failed to send messages:', error.message);
    throw error;
  }

};




export { uploadWhatsappMedia, sendMessage };
