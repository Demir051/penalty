import express from 'express';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs/promises';
import { existsSync, unlinkSync } from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import TrafficPenalty from '../models/TrafficPenalty.js';
import User from '../models/User.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Helper function to convert Excel date to JavaScript Date
const excelDateToJSDate = (excelDate) => {
  if (!excelDate || typeof excelDate !== 'number') return null;
  // Excel date is days since 1900-01-01
  const excelEpoch = new Date(1899, 11, 30);
  const jsDate = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
  return jsDate;
};

// Helper function to convert Excel time to string
const excelTimeToString = (excelTime) => {
  if (!excelTime || typeof excelTime !== 'number') return null;
  const hours = Math.floor(excelTime * 24);
  const minutes = Math.floor((excelTime * 24 - hours) * 60);
  const seconds = Math.floor(((excelTime * 24 - hours) * 60 - minutes) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// Helper function to map Excel row to TrafficPenalty document
const mapExcelRowToPenalty = (row) => {
  const penalty = {
    cezaNo: row['Ceza no'] || null,
    olayTarihi: excelDateToJSDate(row['Olay tarihi']),
    olaySaati: excelTimeToString(row['Olay saati']),
    makbuzSaati: excelTimeToString(row['Makbuz saati']),
    olayYeri: row['Olay yeri'] || null,
    koordinat: row['Koordinat'] || null,
    mesafe: row['Mesafe'] || null,
    olayAdresi: row['Olay adresi'] || null,
    surusBaslangicAdresi: row['Sürüş başlangıç adresi'] || null,
    surusOlay: row['Sürüş - Olay'] || null,
    surusID: row['Sürüş ID'] || null,
    
    // Yolcu Bilgileri
    yolcuID: row['Yolcu ID'] || null,
    yolcuTCKN: row['Yolcu TCKN'] || null,
    yolcuTelno: row['Yolcutelno'] ? String(row['Yolcutelno']) : null,
    yolcuIsmi: row['Yolcu ismi'] || null,
    yolcuToplamYolculuk: row['Yolcu toplam yolculuk'] || null,
    yolcuAradi: row['Yolcu aradı'] || null,
    yolcuMakbuz: row['Yolcu makbuz'] || null,
    yolcuOdemişMi: row['Yolcu Ödemiş mi?'] || null,
    yolcuIcinCezaOdenecekMi: row['Yolcu için ceza ödenecek mi?'] || null,
    yolcuCezaOdemeMailiAtildiMi: row['Yolcu Ceza ödeme maili atıldı mı?'] || null,
    yolcuOdenecekOdenmeyecekBilgisiVerilenTarihSaat: row["Yolcu 'Ödenecek / Ödenmeyecek' bilgisi verilen tarih ve saat"] || null,
    yolcuCezaOdenmeTarihi: row['Yolcu Ceza ödenme tarihi'] || null,
    yolcuOdenenMeblag: row['Yolcu Ödenen Meblağ'] || null,
    cezaiIslemUygulananYolcu: row['Cezai işlem uygulanan yolcu'] || null,
    yolcuPolisMemuru: row['Yolcu - polis memuru'] || null,
    
    // Sürücü Bilgileri
    surucuID: row['Sürücü lD'] || row['Sürücü ID'] || null,
    surucuTCKN: row['Sürücü TCKN'] || null,
    surucuTelno: row['Sürücü telno'] ? String(row['Sürücü telno']) : null,
    surucuIsmi: row['Sürücü ismi'] || null,
    surucuKayitTarihi: row['Sürücü kayıt tarihi'] ? new Date(row['Sürücü kayıt tarihi']) : null,
    surucuToplamYolculuk: row['Sürücü toplam yolculuk '] || null,
    surucuAradi: row['Sürücü aradı'] || null,
    surucuMakbuz: row['Sürücü - makbuz'] || null,
    surucuOdemişMi: row['Sürücü Ödemiş mi?'] || null,
    cezaEskiOtoparkOdenecekMi: row['Ceza(eski)/ Otopark ödenecek mi? (Zorbey)'] || null,
    anlasmaliHukukiDanismanlikFirmasinaMailiAtildiMi: row['Anlaşmalı Hukuki Danışamlık Firmasına maili atıldı mı?'] || null,
    yonlendirilenHukukiDanismanlikFirmasi: row['Yönlendirilen Hukuki Danışmanlık Firması'] || null,
    surucuOdenecekOdenmeyecekBilgisiVerilenTarihSaat: row["Sürücü 'Ödenecek/Ödenmeyecek' bilgisi verilen tarih ve saat"] || null,
    surucuCezaOdenmeTarihi: row['Sürücü Ceza ödenme tarihi'] || null,
    surucuOdenenMeblag: row['Sürücü Ödenen Meblağ'] || null,
    cezaiIslemUygulananSurucu: row['Cezai işlem uygulanan sürücü'] || null,
    surucuPolisMemuru: row['Sürücü - polis memuru'] || null,
    surucuDestekIcinCCArama: row['Sürücü - Destek için CC arama'] || null,
    surucuYonlendirme: row['Sürücü - Yönlendirme'] || null,
    
    // Araç Bilgileri
    aracMarkaModel: row['Araç marka / model'] || null,
    aracPlaka: row['Araç plaka'] || null,
    makbuzdaYazanPlaka: row['Makbuzda yazan plaka'] || null,
    yaka: row['Yaka'] || null,
    aracGecmisi: row['Araç geçmişi'] || null,
    aracinCekildigiOtopark: row['Aracın çekildiği otopark'] || null,
    
    // TAG ve Durum Bilgileri
    tagSoylenmişMi: row['TAG söylenmiş mi?'] || null,
    tagOlduguNasilAnlasildi: row['TAG olduğu nasıl anlaşıldı?'] || null,
    ilkArayan: row['İlk Arayan'] || null,
    cevirmeMiMobilMi: row['Çevirme mi Mobil mi'] || null,
    sorguDurumu: row['Sorgu durumu (Çapraz/ normal)'] || null,
    aractanIndirilmişMi: row['Araçtan indirilmiş mi?'] || null,
    telefonuElindenAlinmişMi: row['Telefonu elinden alınmış mı?'] || null,
    muameleNasil: row['Muamele nasıl?'] || null,
    son3Sorudan1iEvetMiUsulsuzMu: row["SON 3 SORUDAN 1'İ EVET Mİ? USULSÜZ MÜ?"] || null,
    yolcuNeredeOturuyordu: row['Yolcu nerede oturuyordu?'] || null,
    tutanaktaImzaVarMi: row['Tutanakta imza var mı?'] || null,
    hukukBurosOnayiVarMi: row['Hukuk bürosu onayı var mı? '] || null,
    itirazIcinGecenGunSayisi: row['İtiraz için geçen gün sayısı'] || null,
    tuzakMi: row['Tuzak mı?'] || null,
    kuryeCezasiMi: row['Kurye Cezası mı?'] || null,
    notlar: row['__EMPTY_1'] || null,
    
    // Şaibeli ve taksici durumu - Günlük sayfasından kontrol edilecek
    saibeliMi: false,
    taksiciCezasiMi: false,
  };
  
  return penalty;
};

// Import Excel data (Optimized with bulk operations)
router.post('/import', authenticateToken, upload.single('excelFile'), async (req, res) => {
  // Declare variables outside try block so they're accessible in finally
  let excelPath;
  let shouldDeleteFile = false;
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can import data' });
    }

    // Check if file is uploaded or use default path
    
    if (req.file) {
      excelPath = req.file.path;
      shouldDeleteFile = true;
    } else {
      excelPath = path.join(__dirname, '../../TAG - Ceza2.xlsx');
    }
    
    // If clearExisting is true, delete all existing penalties first
    if (req.body.clearExisting === 'true' || req.body.clearExisting === true) {
      await TrafficPenalty.deleteMany({});
    }
    
    // Use ExcelJS for streaming read - much more memory efficient
    console.log('Reading Excel file with ExcelJS (streaming)...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    
    // Read "Günlük" sheet for saibeli and taksici info
    const gunlukSheet = workbook.getWorksheet('Günlük');
    if (!gunlukSheet) {
      throw new Error('Günlük sheet not found');
    }
    
    // Create maps for saibeli and taksici
    const saibeliSet = new Set();
    const taksiciSet = new Set();
    
    // Find column indices from header row
    let saibeliColIndex = -1;
    let nextColIndex = -1;
    const headerRow = gunlukSheet.getRow(1);
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (cell.value === 'Şaibeli mi?') {
        saibeliColIndex = colNumber;
        nextColIndex = colNumber + 1;
      }
    });
    
    console.log(`Processing Günlük sheet...`);
    let gunlukRowCount = 0;
    
    // Process Günlük sheet row by row (skip header row 1)
    gunlukSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const tarihCell = row.getCell(2); // Column B
      const surucuCell = row.getCell(3); // Column C
      
      if (!tarihCell.value || !surucuCell.value) return;
      
      const tarih = tarihCell.value instanceof Date ? tarihCell.value : excelDateToJSDate(tarihCell.value);
      const surucuIsmi = String(surucuCell.value);
      if (!tarih || !surucuIsmi) return;
      
      const key = `${tarih.toISOString().split('T')[0]}_${surucuIsmi}`;
      
      if (saibeliColIndex !== -1) {
        const saibeliCell = row.getCell(saibeliColIndex);
        if (saibeliCell.value === 'Evet') {
          saibeliSet.add(key);
        }
      }
      
      if (nextColIndex !== -1) {
        const nextCell = row.getCell(nextColIndex);
        const nextColValue = nextCell.value ? String(nextCell.value).toLowerCase() : '';
        if (nextColValue.includes('taksi') || nextColValue.includes('taksici')) {
          taksiciSet.add(key);
        }
      }
      
      gunlukRowCount++;
    });
    
    console.log(`Processed ${gunlukRowCount} rows from Günlük sheet`);
    console.log(`Saibeli entries: ${saibeliSet.size}, Taksici entries: ${taksiciSet.size}`);
    
    // Get "Liste" sheet
    const listeSheet = workbook.getWorksheet('Liste');
    if (!listeSheet) {
      throw new Error('Liste sheet not found');
    }
    
    console.log(`Liste sheet found, processing row by row...`);
    
    // Get existing ceza numbers in smaller chunks to avoid memory issues
    console.log('Fetching existing penalties...');
    const existingCezaNoSet = new Set();
    let lastCezaNo = 0;
    const EXISTING_BATCH = 1000; // Load 1000 at a time
    
    while (true) {
      const existingBatch = await TrafficPenalty.find(
        { cezaNo: { $gt: lastCezaNo } },
        { cezaNo: 1 }
      )
      .sort({ cezaNo: 1 })
      .limit(EXISTING_BATCH)
      .lean();
      
      if (existingBatch.length === 0) break;
      
      existingBatch.forEach(p => existingCezaNoSet.add(p.cezaNo));
      lastCezaNo = existingBatch[existingBatch.length - 1].cezaNo;
      
      if (existingBatch.length < EXISTING_BATCH) break;
    }
    
    console.log(`Found ${existingCezaNoSet.size} existing penalties`);
    
    // Build column name to index map from header row
    const columnMap = {};
    const listeHeaderRow = listeSheet.getRow(1);
    listeHeaderRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (cell.value) {
        columnMap[String(cell.value)] = colNumber;
      }
    });
    
    // Helper function to get cell value by column name
    const getCellValue = (row, columnName) => {
      const colIndex = columnMap[columnName];
      if (!colIndex) return null;
      const cell = row.getCell(colIndex);
      return cell.value !== undefined ? cell.value : null;
    };
    
    // Process all rows in smaller batches - read row by row (streaming)
    const BATCH_SIZE = 50; // Process 50 rows at a time (safer for memory)
    let imported = 0;
    let updated = 0;
    let errors = 0;
    let processedCount = 0;
    let batchNum = 0;
    let toInsert = [];
    let bulkUpdateOps = [];
    let pendingBatch = null;
    
    // Helper function to process a batch
    const processBatch = async () => {
      if (toInsert.length === 0 && bulkUpdateOps.length === 0) return;
      
      batchNum++;
      const currentToInsert = [...toInsert];
      const currentBulkOps = [...bulkUpdateOps];
      toInsert = [];
      bulkUpdateOps = [];
      
      // Write batch to DB
      if (currentToInsert.length > 0) {
        try {
          const result = await TrafficPenalty.insertMany(currentToInsert, { ordered: false });
          imported += result.length;
          console.log(`Batch ${batchNum}: Inserted ${result.length} records (Total: ${imported})`);
        } catch (error) {
          if (error.writeErrors) {
            errors += error.writeErrors.length;
            imported += (error.insertedCount || 0);
          } else {
            errors += currentToInsert.length;
          }
        }
      }
      
      if (currentBulkOps.length > 0) {
        try {
          const result = await TrafficPenalty.bulkWrite(currentBulkOps, { ordered: false });
          updated += result.modifiedCount || currentBulkOps.length;
          console.log(`Batch ${batchNum}: Updated ${result.modifiedCount || currentBulkOps.length} records`);
        } catch (error) {
          errors += currentBulkOps.length;
        }
      }
      
      // Log progress
      if (processedCount % 500 === 0) {
        console.log(`Progress: ${processedCount} rows processed`);
      }
    };
    
    // Process Liste sheet row by row (skip header row 1)
    listeSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      try {
        // Check if Ceza no exists
        const cezaNo = getCellValue(row, 'Ceza no');
        if (!cezaNo || cezaNo === null || cezaNo === undefined || cezaNo === '') {
          return;
        }
        
        // Convert ExcelJS row to object format for mapExcelRowToPenalty
        const rowObj = {};
        Object.keys(columnMap).forEach(colName => {
          rowObj[colName] = getCellValue(row, colName);
        });
        
        const penaltyData = mapExcelRowToPenalty(rowObj);
        
        if (!penaltyData.cezaNo) {
          return;
        }
        
        // Check if saibeli or taksici
        if (penaltyData.olayTarihi && penaltyData.surucuIsmi) {
          const key = `${penaltyData.olayTarihi.toISOString().split('T')[0]}_${penaltyData.surucuIsmi}`;
          if (saibeliSet.has(key)) {
            penaltyData.saibeliMi = true;
          }
          if (taksiciSet.has(key)) {
            penaltyData.taksiciCezasiMi = true;
          }
        }
        
        if (existingCezaNoSet.has(penaltyData.cezaNo)) {
          bulkUpdateOps.push({
            updateOne: {
              filter: { cezaNo: penaltyData.cezaNo },
              update: { $set: { ...penaltyData, updatedAt: new Date() } },
            },
          });
        } else {
          toInsert.push(penaltyData);
        }
        
        processedCount++;
        
        // Process batch when it reaches BATCH_SIZE (non-blocking)
        if (toInsert.length + bulkUpdateOps.length >= BATCH_SIZE) {
          if (!pendingBatch) {
            pendingBatch = processBatch().then(() => {
              pendingBatch = null;
            });
          }
        }
      } catch (error) {
        errors++;
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Error processing row ${rowNumber}:`, error.message);
        }
      }
    });
    
    // Wait for any pending batch to complete
    if (pendingBatch) {
      await pendingBatch;
    }
    
    // Process remaining items
    await processBatch();
    
    res.json({
      message: 'Import completed',
      imported,
      updated,
      errors,
      total: processedCount,
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  } finally {
    // Clean up uploaded file
    if (shouldDeleteFile && req.file && existsSync(req.file.path)) {
      unlinkSync(req.file.path);
    }
  }
});

// Get all penalties with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    
    if (req.query.cezaNo) {
      filter.cezaNo = parseInt(req.query.cezaNo);
    }
    
    if (req.query.surucuIsmi) {
      filter.surucuIsmi = { $regex: req.query.surucuIsmi, $options: 'i' };
    }
    
    if (req.query.yolcuIsmi) {
      filter.yolcuIsmi = { $regex: req.query.yolcuIsmi, $options: 'i' };
    }
    
    if (req.query.aracPlaka) {
      filter.aracPlaka = { $regex: req.query.aracPlaka, $options: 'i' };
    }
    
    if (req.query.olayYeri) {
      filter.olayYeri = { $regex: req.query.olayYeri, $options: 'i' };
    }
    
    if (req.query.saibeliMi !== undefined) {
      filter.saibeliMi = req.query.saibeliMi === 'true';
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.olayTarihi = {};
      if (req.query.startDate) {
        filter.olayTarihi.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.olayTarihi.$lte = new Date(req.query.endDate);
      }
    }
    
    const penalties = await TrafficPenalty.find(filter)
      .sort({ olayTarihi: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await TrafficPenalty.countDocuments(filter);
    
    res.json({
      penalties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get penalties error:', error);
    res.status(500).json({ message: 'Failed to fetch penalties', error: error.message });
  }
});

// Get single penalty by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const penalty = await TrafficPenalty.findById(req.params.id);
    if (!penalty) {
      return res.status(404).json({ message: 'Penalty not found' });
    }
    res.json(penalty);
  } catch (error) {
    console.error('Get penalty error:', error);
    res.status(500).json({ message: 'Failed to fetch penalty', error: error.message });
  }
});

// Update penalty
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'ceza')) {
      return res.status(403).json({ message: 'Only admins and ceza role can update penalties' });
    }
    
    const penalty = await TrafficPenalty.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!penalty) {
      return res.status(404).json({ message: 'Penalty not found' });
    }
    
    res.json(penalty);
  } catch (error) {
    console.error('Update penalty error:', error);
    res.status(500).json({ message: 'Failed to update penalty', error: error.message });
  }
});

// Get statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.olayTarihi = {};
      if (startDate) dateFilter.olayTarihi.$gte = new Date(startDate);
      if (endDate) dateFilter.olayTarihi.$lte = new Date(endDate);
    }
    
    // Total penalties
    const totalPenalties = await TrafficPenalty.countDocuments(dateFilter);
    
    // Saibeli penalties
    const saibeliCount = await TrafficPenalty.countDocuments({ ...dateFilter, saibeliMi: true });
    
    // Sürücü cezaları (Sürücü cezası alındı mı? = Evet)
    // Note: This field might not exist in Liste sheet, we'll check surucuOdemişMi or other indicators
    const surucuCezalari = await TrafficPenalty.countDocuments({
      ...dateFilter,
      $or: [
        { surucuOdemişMi: { $in: ['Evet', 'Bilinmiyor'] } },
        { cezaEskiOtoparkOdenecekMi: 'Evet' },
      ],
    });
    
    // Yolcu cezaları
    const yolcuCezalari = await TrafficPenalty.countDocuments({
      ...dateFilter,
      $or: [
        { yolcuOdemişMi: { $in: ['Evet', 'Bilinmiyor'] } },
        { yolcuIcinCezaOdenecekMi: { $in: ['Evet', 'Belirsiz'] } },
      ],
    });
    
    // Monthly breakdown
    const monthlyData = await TrafficPenalty.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$olayTarihi' },
            month: { $month: '$olayTarihi' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    
    // Daily breakdown - use dateFilter if provided, otherwise last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyFilter = {
      ...dateFilter,
      olayTarihi: dateFilter.olayTarihi || { $gte: thirtyDaysAgo },
    };
    
    const dailyData = await TrafficPenalty.aggregate([
      {
        $match: dailyFilter,
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$olayTarihi',
              timezone: 'Europe/Istanbul'
            } 
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    
    // Taksici cezaları (taksiciCezasiMi = true)
    const taksiciCezalari = await TrafficPenalty.countDocuments({
      ...dateFilter,
      taksiciCezasiMi: true,
    });
    
    // Normal cezalar (ne şaibeli ne taksici)
    const normalCezalar = await TrafficPenalty.countDocuments({
      ...dateFilter,
      saibeliMi: false,
      taksiciCezasiMi: false,
    });
    
    // Top locations (only non-null locations)
    const topLocations = await TrafficPenalty.aggregate([
      { 
        $match: {
          ...dateFilter,
          olayYeri: { $ne: null, $exists: true },
        },
      },
      {
        $group: {
          _id: '$olayYeri',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    
    res.json({
      totalPenalties,
      saibeliCount,
      taksiciCezalari,
      normalCezalar,
      surucuCezalari,
      yolcuCezalari,
      monthlyData: monthlyData.map(item => ({
        year: item._id.year,
        month: item._id.month,
        count: item.count,
      })),
      dailyData: dailyData.map(item => ({
        date: item._id,
        count: item.count,
      })),
      topLocations: topLocations.map(item => ({
        location: item._id || 'Bilinmeyen',
        count: item.count,
      })),
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
});

export default router;

