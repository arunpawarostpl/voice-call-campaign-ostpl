import campaignReport from "../models/report.js";


const updateCampaignReport = async (campaignRefIds, bulkResponses) => {
    for (const response of bulkResponses) {
      const { CAMPAIGN_REF_ID, ...responseData } = response;
  
      // Check if the current response has a campaignRefId in the list
      if (!campaignRefIds.includes(CAMPAIGN_REF_ID)) {
        console.log(`Skipping response for campaignRefId: ${CAMPAIGN_REF_ID}`);
        continue;
      }
  
      // Find the existing document for the specific campaignRefId
      let existingCampaign = await campaignReport.findOne({ campaignRefId: CAMPAIGN_REF_ID });
  
      if (!existingCampaign) {
        console.log(`Campaign with ID ${CAMPAIGN_REF_ID} not found. Skipping.`);
        continue;
      }
  
      const existingHitIndex = existingCampaign.hits.findIndex(hit =>
        hit.responses.some(existingResponse => compareResponses(existingResponse, responseData))
      );
  
      if (existingHitIndex !== -1) {
        existingCampaign.hits[existingHitIndex].count++;
      } else {
        existingCampaign.hits.push({ count: 1, responses: [responseData] });
      }
  
      await existingCampaign.save();
  
      console.log('API Hit Count:', existingCampaign.hits[existingHitIndex].count);
      console.log('Response Data:', responseData);
    }
  };
  
  const compareResponses = (response1, response2) => {
    // Implement your logic to compare responses here
    // Return true if responses are considered the same, otherwise false
  };
  
  export default updateCampaignReport;