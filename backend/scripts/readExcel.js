import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../../TAG - Ceza2.xlsx');

try {
  const workbook = XLSX.readFile(excelPath);
  
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('\n');
  
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    console.log(`Total Rows: ${data.length}`);
    if (data.length > 0) {
      console.log('\nFirst Row (Sample):');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\nColumn Headers:');
      console.log(Object.keys(data[0]));
      
      if (data.length > 1) {
        console.log('\nSecond Row (Sample):');
        console.log(JSON.stringify(data[1], null, 2));
      }
    }
  });
} catch (error) {
  console.error('Error reading Excel file:', error);
}

