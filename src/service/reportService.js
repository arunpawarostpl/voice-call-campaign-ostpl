// reportService.js

// import createCsvWriter from 'csv-writer/createObjectCsvWriter';
import { createObjectCsvWriter } from 'csv-writer';

import campaignReport from '../models/report.js'; // Replace with your actual path
import { format } from "fast-csv";
import csv from "fast-csv"
import fs from "fs"
import obdCampaignModel from '../models/obdCampaign.js';

async function generateCSV(campaignRefId) {
    try {

        const dataFromDB = await fetchDataFromDB(campaignRefId);
        if (dataFromDB.length === 0) {
            return({ error: 'No data found for the provided CAMPAIGN_REF_ID' });
          }

const csvStream= csv.format({
    headers:true
});


const exportReportDir = 'public/files/export_report';

if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

// Ensure 'public/files' directory exists
if (!fs.existsSync('public/files')) {
    fs.mkdirSync('public/files');
}

// Ensure 'public/files/export_report' directory exists
if (!fs.existsSync(exportReportDir)) {
    fs.mkdirSync(exportReportDir);
}

const writableStream= fs.createWriteStream(
    `public/files/export_report/report_${campaignRefId}.csv`

);

csvStream.pipe(writableStream)

if(dataFromDB.length>0){
    dataFromDB.map(data=>{
        csvStream.write({
            Ref_id:data.CAMPAIGN_REF_ID? data.CAMPAIGN_REF_ID:'-',
            DNI :data.DNI?data.DNI:'-',
            Customer_Number:data.A_PARTY_NO?data.A_PARTY_NO:'-',
            Status:data.A_DIAL_STATUS?data.A_DIAL_STATUS:'-',
            Duration:data.OG_DURATION?data.OG_DURATION:'-',
        })
    })
}

csvStream.end();
writableStream.end()
return new Promise((resolve) => {
    writableStream.on('finish', () => {
        resolve({
            downloadUrl: `/files/export_report/report_${campaignRefId}.csv`
        });
    });
});
        // return { success: true, message: 'CSV file generated successfully.'  };
  } 
       catch (error) {
        console.error('Error generating CSV:', error);
        return  { success: false, error: 'Internal Server Error' };
}
}



const fetchDataFromDB = async (CAMPAIGN_REF_ID) => {
    // Fetch specific fields from MongoDB based on CAMPAIGN_REF_ID
    const dataFromDB = await campaignReport.aggregate([
        { $match: { campaignRefId: CAMPAIGN_REF_ID } },
        { $unwind: '$hits' },
        { $unwind: '$hits.responses' },
        {
          $sort: { 'hits.responses.A_PARTY_DIAL_START_TIME': -1 },
        },
        {
          $group: {
            _id: '$hits.responses.A_PARTY_NO',
            latestResponse: { $first: '$hits.responses' },
          },
        },
        {
          $project: {
            _id: 0,
            latestResponse: 1,
          },
        },
      ]);
      
      // Extract the latest responses
      const filteredResponses = dataFromDB.map(({ latestResponse }) => latestResponse);  
      return filteredResponses
  };



  async function generateUserCSV(campaignRefId) {
    try {
console.log(
    "inter in a func"
);
        const dataFromDB = await fetchDataFromDB(campaignRefId);
        const camapaignNumber=await obdCampaignModel.findOne({campaign_ref_Id:campaignRefId})
        
        console.log("Numbers",campaignRefId);
        const UserNumbers= camapaignNumber.numbers
        const missingNumbers = UserNumbers.filter(UserNumbers => !dataFromDB.some(record => record.A_PARTY_NO === UserNumbers));
        console.log("missingNumbers",missingNumbers);

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
// const csvStream= csv.format({
//     headers:true
// });


// const exportReportDir = 'public/files/export_report';

// if (!fs.existsSync('public')) {
//     fs.mkdirSync('public');
// }

// // Ensure 'public/files' directory exists
// if (!fs.existsSync('public/files')) {
//     fs.mkdirSync('public/files');
// }

// // Ensure 'public/files/export_report' directory exists
// if (!fs.existsSync(exportReportDir)) {
//     fs.mkdirSync(exportReportDir);
// }

// const writableStream= fs.createWriteStream(
//     `public/files/export_report/report_${campaignRefId}.csv`

// );

// csvStream.pipe(writableStream)

// if(finalNumbers.length>0){
//     finalNumbers.map(data=>{
//         csvStream.write({
//             Customer_Number:data.A_PARTY_NO?data.A_PARTY_NO:'-',
//             Status:data.A_DIAL_STATUS?data.A_DIAL_STATUS:'-',
//         })
//     })
// }

// csvStream.end();
// writableStream.end()
// return new Promise((resolve) => {
//     writableStream.on('finish', () => {
//         resolve({
//             downloadUrl: `/files/export_report/report_${campaignRefId}.csv`
//         });
//     });
// });
shuffleArray(finalNumbers)
        return (finalNumbers);
  } 
       catch (error) {
        console.error('Error generating CSV:', error);
        return  { success: false, error: 'Internal Server Error' };
}
}

export { generateCSV,generateUserCSV };
