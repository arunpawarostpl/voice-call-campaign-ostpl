import csv from 'csv-parser'
import xlsx from 'xlsx'
import fs from 'fs'
import path from 'path'
import csvParser from 'csv-parser'

async function handleCSVUpload (csvString) {
  const numbers = []

  const stream = fs.createReadStream(csvString)

  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', row => {
        numbers.push(row.Numbers) // Assuming the column name in the CSV is 'number'
      })
      .on('end', () => {
        resolve(numbers)
      })
      .on('error', error => {
        reject(error)
      })
  })
}

async function parseCSVBuffer(numberFileBuffer) {
  const numbers = [];

  return new Promise((resolve, reject) => {
    const stream = numberFileBuffer.pipe(csv());

    stream
      .on('data', (row) => {
        // Assuming the column name in the CSV is 'Numbers'
        numbers.push(row.Numbers);
      })
      .on('end', () => {
        console.log("number",numbers);
        resolve(numbers);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function handleExcelUpload (req) {
  if (!req.file) {
    throw new Error('No file uploaded')
  }

  const numbers = []

  const workbook = xlsx.readFile(req.file.path)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  const excelData = xlsx.utils.sheet_to_json(worksheet)

  for (const row of excelData) {
    // Assuming the column name in the Excel file is 'number'
    numbers.push(row.Numbers)
  }

  return numbers
}

function deleteFile (filePath) {
  fs.unlink(filePath, err => {
    if (err) {
      console.error('Error deleting file:', err)
      // Handle error deleting the file
    } else {
      console.log('File deleted successfully')
    }
  })
}

// const generateExcel = (numbers) => {
//     const folderName = 'obdUploads';
//     const folderPath = path.join(process.cwd(), folderName);

//     // Create the 'obuploads' folder if it doesn't exist
//     if (!fs.existsSync(folderPath)) {
//         fs.mkdirSync(folderPath);
//     }

//     const ws = xlsx.utils.json_to_sheet(numbers.map(num => ({ Number: num })));
//     const wb = xlsx.utils.book_new();
//     xlsx.utils.book_append_sheet(wb, ws, 'Numbers');

//     const wbout = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

//     const filename = `numbers_${Date.now()}.xlsx`;
//     const filePath = path.join(folderPath, filename);

//     fs.writeFileSync(filePath, wbout);

//     console.log(`Excel file generated in 'obdUploads' folder: ${filename}`);
//     return filePath;
// };

// Example usage
const numbers = [1, 2, 3, 4, 5] // Replace with your data
// const excelFilePath = generateExcel(numbers);
// console.log(`Generated Excel file path: ${excelFilePath}`);




async function generateCSV(numbers) {
  try {
      // Convert the array of numbers into a CSV string
      const csvData = numbers.join('\n');

      // Write the CSV data to a file
      fs.writeFileSync('obdUploads/data.csv', csvData);

      console.log('CSV file generated successfully.');
  } catch (error) {
      console.error('Error generating CSV file:', error);
  }
}




async function saveVideoFromBuffer(buffer, filename) {
  try {
   
    const outputPath = path.join('obdUploads', filename); 
     fs.writeFileSync(outputPath, buffer);
    console.log(`Video saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error saving video:', error);
  }
}
export { handleCSVUpload, handleExcelUpload, deleteFile ,parseCSVBuffer,generateCSV,saveVideoFromBuffer}
