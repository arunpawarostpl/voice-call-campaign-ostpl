import campaignReport from '../models/report.js'; // Replace with your actual path
import obdCampaignModel from '../models/obdCampaign.js';

async function generateCSV(campaignRefId) {
    try {
        const dataFromDB = await fetchComplteData(campaignRefId);
        if (dataFromDB.length === 0) {
            return({ error: 'No data found for the provided CAMPAIGN_REF_ID' });
          }
return(dataFromDB)
  } 
       catch (error) {
        console.error('Error generating CSV:', error);
        return  { success: false, error: 'Internal Server Error' };
}
}

const fetchComplteData= async(CAMPAIGN_REF_ID)=>{
  const data= await campaignReport.find({campaignRefId: CAMPAIGN_REF_ID})

  const transformedData = data.flatMap(doc => doc.hits.flatMap(hit => hit.responses));
  return transformedData;
}



const fetchDataFromDB = async (CAMPAIGN_REF_ID) => {
    // Fetch specific fields from MongoDB based on CAMPAIGN_REF_ID
    // const dataFromDB = await campaignReport.aggregate([
    //     { $match: { campaignRefId: CAMPAIGN_REF_ID } },
    //     { $unwind: '$hits' },
    //     { $unwind: '$hits.responses' },
    //     {
    //       $sort: { 'hits.responses.A_PARTY_DIAL_START_TIME': -1 },
    //     },
    //     {
    //       $group: {
    //         _id: '$hits.responses.A_PARTY_NO',
    //         latestResponse: { $first: '$hits.responses' },
    //       },
    //     },
    //     {
    //       $project: {
    //         _id: 0,
    //         latestResponse: 1,
    //       },
    //     },
    //   ]).toArray();
      
    //   // Extract the latest responses
    //   const filteredResponses = dataFromDB.map(({ latestResponse }) => latestResponse);
    //   return filteredResponses
    const allData = await campaignReport.find({ campaignRefId: CAMPAIGN_REF_ID });

// Flatten the data and extract all responses
const allResponses = allData.flatMap(doc => doc.hits.flatMap(hit => hit.responses));

// Group responses by A_PARTY_NO and keep track of the latest response for each A_PARTY_NO
const latestResponsesMap = new Map();
allResponses.forEach(response => {
    const { A_PARTY_NO, A_PARTY_DIAL_START_TIME } = response;
    if (!latestResponsesMap.has(A_PARTY_NO) || A_PARTY_DIAL_START_TIME > latestResponsesMap.get(A_PARTY_NO).A_PARTY_DIAL_START_TIME) {
        latestResponsesMap.set(A_PARTY_NO, response);
    }
});

// Extract the latest responses from the map
const latestResponses = Array.from(latestResponsesMap.values());
return latestResponses
  };



  async function generateUserCSV(campaignRefId) {
    try {
console.log("campaignRefId",campaignRefId);
        const dataFromDB = await fetchDataFromDB(campaignRefId);
        const camapaignNumber=await obdCampaignModel.findOne({campaign_ref_Id:campaignRefId})
        const UserNumbers= camapaignNumber.numbers
        
        const missingNumbers = UserNumbers.filter(UserNumbers => !dataFromDB.some(record => record.A_PARTY_NO === UserNumbers));
        const usersNumberList = missingNumbers.map(UserNumbers => ({
            A_PARTY_NO: UserNumbers,
            A_DIAL_STATUS: 'connected' 
          }));

          const  finalNumbers= dataFromDB.concat(usersNumberList)
          function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [array[i], array[j]] = [array[j], array[i]];
            }
          }

          shuffleArray(finalNumbers);
console.log("final Number",finalNumbers);
        return (finalNumbers);
  } 
       catch (error) {
        console.error('Error generating CSV:', error);
        return  { success: false, error: 'Internal Server Error' };
}
}

export { generateCSV,generateUserCSV };
