import mongoose from 'mongoose';

const trafficPenaltySchema = new mongoose.Schema({
  // Ana Bilgiler
  cezaNo: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  olayTarihi: {
    type: Date,
    required: true,
    index: true,
  },
  olaySaati: String,
  makbuzSaati: String,
  olayYeri: String,
  koordinat: String,
  mesafe: String,
  olayAdresi: String,
  surusBaslangicAdresi: String,
  surusOlay: String,
  surusID: Number,
  
  // Yolcu Bilgileri
  yolcuID: Number,
  yolcuTCKN: String,
  yolcuTelno: String,
  yolcuIsmi: String,
  yolcuToplamYolculuk: Number,
  yolcuAradi: String,
  yolcuMakbuz: String,
  yolcuOdemişMi: String,
  yolcuIcinCezaOdenecekMi: String,
  yolcuCezaOdemeMailiAtildiMi: String,
  yolcuOdenecekOdenmeyecekBilgisiVerilenTarihSaat: Date,
  yolcuCezaOdenmeTarihi: Date,
  yolcuOdenenMeblag: Number,
  cezaiIslemUygulananYolcu: String,
  yolcuPolisMemuru: String,
  
  // Sürücü Bilgileri
  surucuID: Number,
  surucuTCKN: String,
  surucuTelno: String,
  surucuIsmi: String,
  surucuKayitTarihi: Date,
  surucuToplamYolculuk: Number,
  surucuAradi: String,
  surucuMakbuz: String,
  surucuOdemişMi: String,
  cezaEskiOtoparkOdenecekMi: String,
  anlasmaliHukukiDanismanlikFirmasinaMailiAtildiMi: String,
  yonlendirilenHukukiDanismanlikFirmasi: String,
  surucuOdenecekOdenmeyecekBilgisiVerilenTarihSaat: Date,
  surucuCezaOdenmeTarihi: Date,
  surucuOdenenMeblag: Number,
  cezaiIslemUygulananSurucu: String,
  surucuPolisMemuru: String,
  surucuDestekIcinCCArama: String,
  surucuYonlendirme: String,
  
  // Araç Bilgileri
  aracMarkaModel: String,
  aracPlaka: {
    type: String,
    index: true,
  },
  makbuzdaYazanPlaka: String,
  yaka: String,
  aracGecmisi: Number,
  aracinCekildigiOtopark: String,
  
  // TAG ve Durum Bilgileri
  tagSoylenmişMi: String,
  tagOlduguNasilAnlasildi: String,
  ilkArayan: String,
  cevirmeMiMobilMi: String,
  sorguDurumu: String,
  aractanIndirilmişMi: String,
  telefonuElindenAlinmişMi: String,
  muameleNasil: String,
  son3Sorudan1iEvetMiUsulsuzMu: String,
  yolcuNeredeOturuyordu: String,
  tutanaktaImzaVarMi: String,
  hukukBurosOnayiVarMi: String,
  itirazIcinGecenGunSayisi: Number,
  tuzakMi: String,
  kuryeCezasiMi: String,
  notlar: String,
  
  // Şaibeli Durumu
  saibeliMi: {
    type: Boolean,
    default: false,
    index: true,
  },
  
  // Taksici Cezası Durumu
  taksiciCezasiMi: {
    type: Boolean,
    default: false,
    index: true,
  },
  
  // Kayıt Bilgileri
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
trafficPenaltySchema.index({ olayTarihi: -1 });
trafficPenaltySchema.index({ surucuIsmi: 1 });
trafficPenaltySchema.index({ yolcuIsmi: 1 });
// aracPlaka index is already defined in schema, don't duplicate
trafficPenaltySchema.index({ saibeliMi: 1, olayTarihi: -1 });
trafficPenaltySchema.index({ taksiciCezasiMi: 1, olayTarihi: -1 });

export default mongoose.model('TrafficPenalty', trafficPenaltySchema);

