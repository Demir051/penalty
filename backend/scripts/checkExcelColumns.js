import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const excelPath = path.join(__dirname, '../../TAG - Ceza2.xlsx');
const workbook = XLSX.readFile(excelPath);

// Check "Liste" sheet columns
const listeSheet = workbook.Sheets['Liste'];
const listeData = XLSX.utils.sheet_to_json(listeSheet, { defval: null, header: 1 });

console.log('=== Liste Sheet Column Headers (First Row) ===');
if (listeData.length > 0) {
  console.log(listeData[0]);
  console.log('\nColumn count:', listeData[0].length);
}

// Check "Günlük" sheet columns
const gunlukSheet = workbook.Sheets['Günlük'];
const gunlukData = XLSX.utils.sheet_to_json(gunlukSheet, { defval: null, header: 1 });

console.log('\n=== Günlük Sheet Column Headers (First Row) ===');
if (gunlukData.length > 0) {
  console.log(gunlukData[0]);
  console.log('\nColumn count:', gunlukData[0].length);
}

// Check a sample row from Günlük to see structure
console.log('\n=== Sample Row from Günlük (Row 2) ===');
if (gunlukData.length > 1) {
  console.log(gunlukData[1]);
}

