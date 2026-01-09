import { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Save, Send, ContentCopy, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Beyanmatik = () => {
  const { user } = useAuth();
  // Form state
  const [formData, setFormData] = useState({
    // Temel bilgiler
    cezaNo: '',
    olayTarihi: '',
    olaySaati: '',
    olayYeri: '',
    // Yolcu bilgileri
    yolcuId: '',
    yolcuIsmi: '',
    yolcuTelNo: '',
    yolcuYolculukSayisi: '',
    // Sürücü bilgileri
    surucuId: '',
    surucuIsmi: '',
    surucuTelNo: '',
    surucuKayitTarihi: '',
    aracMarkaModel: '',
    aracPlaka: '',
    surucuYolculukSayisi: '',
    // Diğer bilgiler
    cevirme: '',
    yolcuNeredeOturuyordu: '',
    resmiKurumaTagSozlesmesi: '',
    tagDendigindeTepki: '',
    tagOlduguNasilAnlasildi: '',
    polisMemuru: '',
    kacinciCezasi: '',
    sorguDurumu: '',
    hangiAndaCeza: '',
    erkenUyariyaDustuMu: '',
    surucuyeBilgiVerildiMi: '',
    aracHangiOtoparkaCekildi: '',
    polisTelefonBaktiMi: '',
    telefonBakildiMi: '',
    aracAramaYapildiMi: '',
    tutanakImzaAtildiMi: '',
    videoSesKaydiMevcutMu: '',
    sorguEsnasindaAractanIndirildiMi: '',
    telefonBakmakIstedilerMi: '',
    telefonBaktilarMi: '',
    caprazSorguYaptilarMi: '',
    sorgudaBaskiYaptilarMi: '',
    zorlaTutanakImzalattilarMi: '',
    not: '',
  });

  // Sorular ve cevaplar state
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Sorular listesi
  const questions = [
    {
      id: 1,
      question: 'Sürücü hattından aradığınızı görüyorum, sürücü olarak mı yolculuk yapıyordunuz?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      key: 'surucuOlarakYolculuk',
    },
    {
      id: 2,
      question: 'Sürüşünüz başlamış mıydı? Yolcudan kodu almış mıydınız?',
      type: 'select',
      options: ['Evet, başlamıştı ve kodu almıştım', 'Hayır, başlamamıştı', 'Kodu almamıştım'],
      key: 'surusBaslamisMiydi',
    },
    {
      id: 3,
      question: 'Olay tarihi nedir?',
      type: 'date',
      key: 'olayTarihi',
    },
    {
      id: 4,
      question: 'Olay ne zaman oldu? Tam olarak saat kaçtı?',
      type: 'time',
      key: 'olaySaati',
    },
    {
      id: 5,
      question: 'Olay yeri neresiydi?',
      type: 'text',
      key: 'olayYeri',
    },
    {
      id: 6,
      question: 'Buluşma noktanız neresiydi?',
      type: 'text',
      key: 'bulusmaNoktasi',
    },
    {
      id: 7,
      question: 'Nereye gidecektiniz?',
      type: 'text',
      key: 'varisYeri',
    },
    {
      id: 8,
      question: 'Yolculuk başladıktan kaç dakika sonra çevirme gerçekleşti? Yolculuk başlamış mıydı?',
      type: 'text',
      key: 'yolculukBasladiktanSonra',
    },
    {
      id: 9,
      question: 'Yolda çevirme uygulaması mı var yoksa mobil ekip miydi?',
      type: 'select',
      options: ['Yolda çevirme uygulaması', 'Mobil ekip', 'Bilmiyorum'],
      key: 'cevirmeTipi',
    },
    {
      id: 10,
      question: 'Sivil ekip miydi yoksa üniformalı trafik polisi miydi?',
      type: 'select',
      options: ['Sivil ekip', 'Üniformalı trafik polisi', 'Her ikisi de', 'Bilmiyorum'],
      key: 'ekipTipi',
    },
    {
      id: 11,
      question: 'Yolcu araçta hangi koltukta oturuyordu?',
      type: 'select',
      options: ['Ön', 'Arka', 'Ön ve arka'],
      key: 'yolcuKoltuk',
    },
    {
      id: 12,
      question: 'Ceza yazan polise TAG sürüşü olduğunu söylediniz mi?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      key: 'tagSozlesmesi',
    },
    {
      id: 13,
      question: 'TAG olduğunu söylediğinizde/düşündüklerinde memurun cevabı tavrı nasıldı?',
      type: 'select',
      options: ['Olumlu', 'Olumsuz', 'Kayıtsız', 'Bilmiyorum'],
      key: 'tagTepki',
    },
    {
      id: 14,
      question: 'Size davranışları nasıldı? Olay sırasında nasıl bir sorgu oldu?',
      type: 'select',
      options: ['Nazik', 'Normal', 'Sert', 'Çok sert'],
      key: 'davranis',
    },
    {
      id: 15,
      question: 'Aracınız hangi otoparka çekildi?',
      type: 'text',
      key: 'otopark',
    },
    {
      id: 16,
      question: 'Aracınızın gözle görülmeyen yerlerinde arama yapıldı mı?',
      type: 'select',
      options: ['Evet', 'Hayır', 'Bilmiyorum'],
      key: 'arama',
    },
    {
      id: 17,
      question: 'Ceza tutanağına imza attınız mı?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      key: 'imza',
    },
    {
      id: 18,
      question: 'Olayla ilgili bir video veya ses kaydı aldınız mı?',
      type: 'select',
      options: ['Evet, video', 'Evet, ses', 'Evet, her ikisi de', 'Hayır'],
      key: 'kayit',
    },
    {
      id: 19,
      question: 'Yolcuyu ve sizi ayırarak ayrı ayrı çapraz sorgu yaptılar mı?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      key: 'caprazSorgu',
    },
    {
      id: 20,
      question: 'Sorgu esnasında araçtan indirildiniz mi?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      key: 'aractanIndirildi',
    },
    {
      id: 21,
      question: 'Memurlar martı sürüşü olduğunu nereden anladı?',
      type: 'select',
      options: ['Benden öğrendiler', 'Yolcudan öğrendiler', 'Uygulamadan gördüler', 'Bilmiyorum'],
      key: 'tagAnlasildi',
    },
    {
      id: 22,
      question: 'Telefonunuza bakmak istediler mi? Evet ise; Baktılar mı?',
      type: 'select',
      options: ['Evet, istediler ve baktılar', 'Evet, istediler ama bakmadılar', 'Hayır, istemediler'],
      key: 'telefonBakma',
    },
    {
      id: 23,
      question: 'Çapraz sorgu yaptılar mı? Hayır ise; Sorguda baskı yaptılar mı?',
      type: 'select',
      options: ['Evet, çapraz sorgu yaptılar', 'Hayır, çapraz sorgu yapmadılar ama baskı yaptılar', 'Hayır, ne çapraz sorgu ne baskı'],
      key: 'caprazSorguBaski',
    },
    {
      id: 24,
      question: 'Zorla tutanak imzalattılar mı?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      key: 'zorlaImza',
    },
    {
      id: 25,
      question: 'TELEFONUNUZA BAKMAK İSTEDİLER Mİ? Evet ise; BAKTILAR MI? (İki soru cevabı da yazılmalı)',
      type: 'select',
      options: ['Evet, baktılar', 'Evet, bakmadılar', 'Hayır'],
      key: 'telefonBakmaDetay',
    },
    {
      id: 26,
      question: 'ÇAPRAZ SORGU YAPTILAR MI? Hayır ise; SORGUDA BASKI YAPTILAR MI? (İki soru cevabı da yazılmalı)',
      type: 'select',
      options: ['Evet', 'Hayır, Evet', 'Hayır, Hayır'],
      key: 'caprazSorguBaskiDetay',
    },
    {
      id: 27,
      question: 'ZORLA TUTANAK İMZALATTILAR MI?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      key: 'zorlaTutanakImza',
    },
  ];

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const renderAnswerField = (question) => {
    const value = answers[question.id] || '';

    switch (question.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small">
            <Select
              value={value}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Seçiniz</em>
              </MenuItem>
              {question.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'date':
        return (
          <TextField
            type="date"
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      case 'time':
        return (
          <TextField
            type="time"
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      default:
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Cevabı giriniz"
          />
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  const generateBeyanText = () => {
    const olayTarihi = formData.olayTarihi || answers[3];
    const olaySaati = formData.olaySaati || answers[4];
    const olayYeri = formData.olayYeri || answers[5];
    const cevirme = formData.cevirme || answers[10];
    const yolcuKoltuk = formData.yolcuNeredeOturuyordu || answers[11];
    const tagSozlesmesi = formData.resmiKurumaTagSozlesmesi || answers[12];
    const tagTepki = formData.tagDendigindeTepki || answers[13];
    const tagAnlasildi = formData.tagOlduguNasilAnlasildi || answers[21];
    const sorguDurumu = formData.sorguDurumu || (answers[19] === 'Evet' ? 'Çapraz' : '');
    const otopark = formData.aracHangiOtoparkaCekildi || answers[15];
    const arama = formData.aracAramaYapildiMi || answers[16];
    const imza = formData.tutanakImzaAtildiMi || answers[17];
    const kayit = formData.videoSesKaydiMevcutMu || answers[18];
    const aractanIndirildi = formData.sorguEsnasindaAractanIndirildiMi || answers[20];
    const zorlaImza = formData.zorlaTutanakImzalattilarMi || answers[24];
    
    // Yolcu koltuk formatı
    let yolcuKoltukText = yolcuKoltuk;
    if (yolcuKoltuk === 'Ön') {
      yolcuKoltukText = 'Önde';
    } else if (yolcuKoltuk === 'Arka') {
      yolcuKoltukText = 'Arkada';
    } else if (yolcuKoltuk === 'Ön ve arka') {
      yolcuKoltukText = 'Ön ve arka';
    }
    
    // Video/ses kaydı formatı
    let kayitText = kayit;
    if (kayit && kayit.includes('Evet')) {
      kayitText = 'Evet';
    }
    
    let text = `Ceza No: ${formData.cezaNo || ''}
Olay tarihi: ${olayTarihi ? formatDate(olayTarihi) : ''}
Olay saati: ${olaySaati ? formatTime(olaySaati) : ''}
Olay yeri: ${olayYeri || ''}
Yolcu ID: ${formData.yolcuId || ''}
Yolcu ismi: ${formData.yolcuIsmi || ''}
Yolcu tel no: ${formData.yolcuTelNo || ''}
Sürücü ID: ${formData.surucuId || ''}
Sürücü ismi: ${formData.surucuIsmi || ''}
Sürücü tel no: ${formData.surucuTelNo || ''}
Sürücü kayıt tarihi: ${formData.surucuKayitTarihi ? formatDateTime(formData.surucuKayitTarihi) : ''}
Araç marka / model: ${formData.aracMarkaModel || ''}
Araç plaka: ${formData.aracPlaka || ''}
Yolcu yolculuk sayısı: ${formData.yolcuYolculukSayisi || ''}
Sürücü yolculuk sayısı: ${formData.surucuYolculukSayisi || ''}
Çevirme (sivil/resmi): ${cevirme || ''}
Yolcu nerede oturuyordu?: ${yolcuKoltukText || ''}
Resmi kuruma Tag sürüşü olduğu söylendi mi?: ${tagSozlesmesi || ''}
Tag dendiğinde nasıl tepki aldı?: ${tagTepki || ''}
Tag olduğu nasıl anlaşıldı?: ${tagAnlasildi || ''}
Ceza kesen memur: ${formData.polisMemuru || ''}
Kaçıncı cezası: ${formData.kacinciCezasi || ''}
Sorgu durumu: ${sorguDurumu || ''}
Hangi anda ceza kesildi?: ${formData.hangiAndaCeza || ''}
Erken uyarıya düştü mü?: ${formData.erkenUyariyaDustuMu || ''}
Düştüyse sürücüye bilgi verildi mi?: ${formData.surucuyeBilgiVerildiMi || ''}
Araç hangi otoparka çekildi?: ${otopark || ''}
Polis cep telefonunu kendi eline alarak ya da sizin elinizde incelemek ekranına bakmak istedi mi?: ${formData.polisTelefonBaktiMi || ''}
Arabanın gözle görülmeyen yerlerinde arama yaptı mı?: ${arama || ''}
Ceza tutanağına imza attınız mı?: ${imza || ''}
Video/ses kaydı mevcut mu?: ${kayitText || ''}
Sorgu esnasında araçtan indirildiniz mi?: ${aractanIndirildi || ''}
 
TELEFONUNUZA BAKMAK İSTEDİLER Mİ? Evet ise; BAKTILAR MI? (İki soru cevabı da yazılmalı): ${answers[25] || getTelefonBakmaAnswer() || ''}
ÇAPRAZ SORGU YAPTILAR MI? Hayır ise; SORGUDA BASKI YAPTILAR MI? (İki soru cevabı da yazılmalı): ${answers[26] || getCaprazSorguBaskiAnswer() || ''}
ZORLA TUTANAK İMZALATTILAR MI?: ${answers[27] || zorlaImza || ''}
 
NOT: ${formData.not || generateNotFromAnswers()}`;

    return text;
  };

  const getTelefonBakmaAnswer = () => {
    const answer = answers[22] || formData.telefonBakmakIstedilerMi;
    if (answer === 'Evet, istediler ve baktılar') return 'Evet, baktılar';
    if (answer === 'Evet, istediler ama bakmadılar') return 'Evet, bakmadılar';
    if (answer === 'Hayır, istemediler') return 'Hayır';
    return '';
  };

  const getCaprazSorguBaskiAnswer = () => {
    const answer = answers[23] || formData.caprazSorguYaptilarMi;
    if (answer === 'Evet, çapraz sorgu yaptılar') return 'Evet';
    if (answer === 'Hayır, çapraz sorgu yapmadılar ama baskı yaptılar') return 'Hayır, Evet';
    if (answer === 'Hayır, ne çapraz sorgu ne baskı') return 'Hayır, Hayır';
    return '';
  };

  const generateNotFromAnswers = () => {
    let not = '';
    
    // Sürücü olarak yolculuk
    if (answers[1] === 'Evet') {
      not += 'Evet, sürücü olarak yolculuk yapıyordum. ';
    }
    
    // Sürüş başlamış mıydı
    if (answers[2]) {
      if (answers[2].includes('başlamıştı ve kodu almıştım')) {
        not += 'Sürüşümüz başlamıştı, yol arkadaşımdan kodu almıştım. ';
      } else if (answers[2].includes('başlamamıştı')) {
        not += 'Sürüşümüz başlamamıştı. ';
      } else if (answers[2].includes('Kodu almamıştım')) {
        not += 'Kodu almamıştım. ';
      }
    }
    
    // Olay tarihi
    const olayTarihi = formData.olayTarihi || answers[3];
    if (olayTarihi) {
      not += `Olay tarihi ${formatDate(olayTarihi)} idi. `;
    }
    
    // Olay saati
    const olaySaati = formData.olaySaati || answers[4];
    if (olaySaati) {
      not += `Olay saati ${formatTime(olaySaati)} idi. `;
    }
    
    // Olay yeri
    const olayYeri = formData.olayYeri || answers[5];
    if (olayYeri) {
      not += `Olay yeri ${olayYeri}. `;
    }
    
    // Buluşma yeri
    if (answers[6]) {
      not += `Buluşma yeri ${answers[6]}. `;
    }
    
    // Varış yeri
    if (answers[7]) {
      not += `Varış yeri ${answers[7]}. `;
    }
    
    // Yolculuk başladıktan sonra
    if (answers[8]) {
      not += `Yolculuk başladıktan ${answers[8]} olumsuz durum yaşandı. `;
    }
    
    // Çevirme uygulaması
    if (answers[9]) {
      not += `Yolda ${answers[9]} vardı. `;
    }
    
    // Ekip tipi
    if (answers[10]) {
      not += `Memurlar, ${answers[10]}ydi. `;
    }
    
    // Yolcu nerede oturuyordu
    const yolcuKoltuk = formData.yolcuNeredeOturuyordu || answers[11];
    if (yolcuKoltuk) {
      let koltukText = '';
      if (yolcuKoltuk === 'Ön') {
        koltukText = 'önde';
      } else if (yolcuKoltuk === 'Arka') {
        koltukText = 'arkada';
      } else if (yolcuKoltuk === 'Ön ve arka') {
        koltukText = 'ön ve arkada';
      } else {
        koltukText = yolcuKoltuk.toLowerCase();
      }
      not += `Yolcu araçta ${koltukText} oturuyordu. `;
    }
    
    // TAG söylendi mi
    const tagSozlesmesi = formData.resmiKurumaTagSozlesmesi || answers[12];
    if (tagSozlesmesi === 'Hayır') {
      not += 'Ceza yazan polise TAG sürüşü olduğunu söylemedim. ';
    }
    
    // Memur davranışı
    const tagTepki = formData.tagDendigindeTepki || answers[13];
    if (tagTepki) {
      if (tagTepki === 'Normal') {
        not += 'Memurların bana karşı davranışları normaldi. ';
      } else if (tagTepki === 'Olumsuz') {
        not += 'Memurların bana karşı davranışları olumsuzdu. ';
      } else {
        not += `Memurların bana karşı davranışları ${tagTepki.toLowerCase()}ydi. `;
      }
    }
    
    // Davranış detayı
    if (answers[14]) {
      if (answers[14] === 'Sert' || answers[14] === 'Çok sert') {
        not += `Çok ${answers[14].toLowerCase()} bir tavırları vardı. `;
      } else {
        not += `${answers[14]}. `;
      }
    }
    
    // Otopark
    const otopark = formData.aracHangiOtoparkaCekildi || answers[15];
    if (otopark) {
      not += `${otopark} Yediemin Otoparkı'na çekildi. `;
    }
    
    // Arama yapıldı mı
    const arama = formData.aracAramaYapildiMi || answers[16];
    if (arama === 'Hayır') {
      not += 'Aracımın gözle görülmeyen yerlerinde arama yapılmadı. ';
    }
    
    // İmza
    const imza = formData.tutanakImzaAtildiMi || answers[17];
    if (imza === 'Hayır') {
      not += 'Ceza tutanağına imza atmadım. ';
    }
    
    // Video/ses kaydı
    const kayit = formData.videoSesKaydiMevcutMu || answers[18];
    if (kayit && kayit !== 'Hayır') {
      not += 'Olayla ilgili bir video veya ses kaydı aldım. ';
    }
    
    // Çapraz sorgu
    const caprazSorgu = answers[19];
    if (caprazSorgu === 'Evet') {
      not += 'Yolcuyu ve beni ayırarak ayrı ayrı çapraz sorgu yaptılar. ';
      not += 'Ben eşimin arkadaşı dedim kendisi galerici araç bakmaya gidiyoruz dedim ama çok da dinlemediler. ';
      not += 'Yolcu söylemiş sanırım çünkü önce ona ceza tutanağı imzalattılar. ';
    }
    
    // Araçtan indirildi mi
    const aractanIndirildi = formData.sorguEsnasindaAractanIndirildiMi || answers[20];
    if (aractanIndirildi === 'Evet') {
      not += 'Sorgu esnasında araçtan indirildik. ';
    }
    
    // TAG nasıl anlaşıldı
    const tagAnlasildi = formData.tagOlduguNasilAnlasildi || answers[21];
    if (tagAnlasildi) {
      if (tagAnlasildi === 'Yolcudan öğrendiler' || tagAnlasildi === 'Yolcudan öğrendiler') {
        not += 'Memurun TAG sürüşü olduğunu anlamalarının sebebi yolcunun söylemlerinden elde ettikleri kanaattir. ';
      } else {
        not += `Memurun TAG sürüşü olduğunu anlamalarının sebebi ${tagAnlasildi.toLowerCase()}dır. `;
      }
    }
    
    // Telefon bakma
    const telefonBakma = answers[22];
    if (telefonBakma === 'Hayır, istemediler') {
      not += 'Telefonuma bakmak istemediler. ';
    } else if (telefonBakma === 'Evet, istediler ve baktılar') {
      not += 'Telefonuma bakmak istediler ve baktılar. ';
    } else if (telefonBakma === 'Evet, istediler ama bakmadılar') {
      not += 'Telefonuma bakmak istediler ama bakmadılar. ';
    }
    
    // Çapraz sorgu ve baskı
    const caprazSorguBaski = answers[23];
    if (caprazSorguBaski === 'Evet, çapraz sorgu yaptılar') {
      not += 'Çapraz sorgu yaptılar. ';
    } else if (caprazSorguBaski === 'Hayır, çapraz sorgu yapmadılar ama baskı yaptılar') {
      not += 'Baskı yapılmadı. ';
    } else if (caprazSorguBaski === 'Hayır, ne çapraz sorgu ne baskı') {
      not += 'Baskı yapılmadı. ';
    }
    
    // Zorla imza
    const zorlaImza = formData.zorlaTutanakImzalattilarMi || answers[24];
    if (zorlaImza === 'Hayır') {
      not += 'Zorla tutanak imzalatmadılar. ';
      not += 'İmzala dediler imzalamadım sonra polis çağırdılar münakaşa yaşandı biraz. ';
      not += 'Ben kendim aracım nereye çekilecekse oraya götürmek istiyorum dedim. ';
      not += 'İzin vermediler. Herhangi bir fiziksel müdahale olmadı. ';
      not += 'Ben bugün avukatla konuştum tutanak hazırlatıyordum aracı çıkarmak için. ';
      not += 'Avukatla da konuşunca o da bana otoparktan çıkarırız dedi dün. ';
    }
    
    // Son satır
    not += 'Ceza makbuzunun net ve okunur şekilde fotoğrafını tagdestek@marti.tech adresine ileteceğim.';
    
    return not.trim();
  };

  const handleCopy = async () => {
    const text = generateBeyanText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Database'e kaydet
    try {
      await axios.post('/api/logs/beyan-copy', {
        beyanContent: text.substring(0, 500), // İlk 500 karakter
      });
    } catch (err) {
      // Sessizce hata yut, kullanıcıyı rahatsız etme
      if (import.meta.env.DEV) {
        console.error('Error logging beyan copy:', err);
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Üst Açıklama */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Öncelikle geçmiş olsun.</strong> Martı TAG, taşımacılık hizmeti veren bir uygulama değil; yalnızca
          yolculuk paylaşımı için teknolojik altyapı sağlayan bir platformdur. Martı TAG, 5651 sayılı Kanun kapsamında
          "yer sağlayıcı" statüsünde olup gerekli tüm yasal yükümlülüklerini yerine getirmektedir.
        </Typography>
      </Alert>

      {/* Logo ve Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            bgcolor: '#4caf50',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.5rem',
          }}
        >
          M
        </Box>
        <Typography variant="h4" component="h1" fontWeight="bold">
          SÜRÜCÜ BEYANMATİK
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sol Sütun - Sürücü ve Yolcu Bilgileri (Scroll Yok) */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, position: 'sticky', top: 20, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
              Temel Bilgiler
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                label="Ceza No"
                value={formData.cezaNo}
                onChange={(e) => handleFormChange('cezaNo', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Olay Tarihi"
                type="date"
                value={formData.olayTarihi}
                onChange={(e) => handleFormChange('olayTarihi', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Olay Saati"
                type="time"
                value={formData.olaySaati}
                onChange={(e) => handleFormChange('olaySaati', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Olay Yeri"
                value={formData.olayYeri}
                onChange={(e) => handleFormChange('olayYeri', e.target.value)}
                size="small"
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
              Yolcu Bilgileri
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                label="Yolcu ID"
                value={formData.yolcuId}
                onChange={(e) => handleFormChange('yolcuId', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Yolcu İsmi"
                value={formData.yolcuIsmi}
                onChange={(e) => handleFormChange('yolcuIsmi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Yolcu Tel No"
                value={formData.yolcuTelNo}
                onChange={(e) => handleFormChange('yolcuTelNo', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Yolcu Yolculuk Sayısı"
                value={formData.yolcuYolculukSayisi}
                onChange={(e) => handleFormChange('yolcuYolculukSayisi', e.target.value)}
                size="small"
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
              Sürücü Bilgileri
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                label="Sürücü ID"
                value={formData.surucuId}
                onChange={(e) => handleFormChange('surucuId', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Sürücü İsmi"
                value={formData.surucuIsmi}
                onChange={(e) => handleFormChange('surucuIsmi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Sürücü Tel No"
                value={formData.surucuTelNo}
                onChange={(e) => handleFormChange('surucuTelNo', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Sürücü Kayıt Tarihi"
                type="datetime-local"
                value={formData.surucuKayitTarihi}
                onChange={(e) => handleFormChange('surucuKayitTarihi', e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Araç Marka / Model"
                value={formData.aracMarkaModel}
                onChange={(e) => handleFormChange('aracMarkaModel', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Araç Plaka"
                value={formData.aracPlaka}
                onChange={(e) => handleFormChange('aracPlaka', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Sürücü Yolculuk Sayısı"
                value={formData.surucuYolculukSayisi}
                onChange={(e) => handleFormChange('surucuYolculukSayisi', e.target.value)}
                size="small"
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
              Diğer Bilgiler
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                label="Çevirme (sivil/resmi)"
                value={formData.cevirme}
                onChange={(e) => handleFormChange('cevirme', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Yolcu nerede oturuyordu?"
                value={formData.yolcuNeredeOturuyordu}
                onChange={(e) => handleFormChange('yolcuNeredeOturuyordu', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Resmi kuruma Tag sürüşü olduğu söylendi mi?"
                value={formData.resmiKurumaTagSozlesmesi}
                onChange={(e) => handleFormChange('resmiKurumaTagSozlesmesi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Tag dendiğinde nasıl tepki aldı?"
                value={formData.tagDendigindeTepki}
                onChange={(e) => handleFormChange('tagDendigindeTepki', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Tag olduğu nasıl anlaşıldı?"
                value={formData.tagOlduguNasilAnlasildi}
                onChange={(e) => handleFormChange('tagOlduguNasilAnlasildi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Ceza kesen memur"
                value={formData.polisMemuru}
                onChange={(e) => handleFormChange('polisMemuru', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Kaçıncı cezası"
                value={formData.kacinciCezasi}
                onChange={(e) => handleFormChange('kacinciCezasi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Sorgu durumu"
                value={formData.sorguDurumu}
                onChange={(e) => handleFormChange('sorguDurumu', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Hangi anda ceza kesildi?"
                value={formData.hangiAndaCeza}
                onChange={(e) => handleFormChange('hangiAndaCeza', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Erken uyarıya düştü mü?"
                value={formData.erkenUyariyaDustuMu}
                onChange={(e) => handleFormChange('erkenUyariyaDustuMu', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Düştüyse sürücüye bilgi verildi mi?"
                value={formData.surucuyeBilgiVerildiMi}
                onChange={(e) => handleFormChange('surucuyeBilgiVerildiMi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Araç hangi otoparka çekildi?"
                value={formData.aracHangiOtoparkaCekildi}
                onChange={(e) => handleFormChange('aracHangiOtoparkaCekildi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Polis cep telefonunu bakmak istedi mi?"
                value={formData.polisTelefonBaktiMi}
                onChange={(e) => handleFormChange('polisTelefonBaktiMi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Arabanın gözle görülmeyen yerlerinde arama yaptı mı?"
                value={formData.aracAramaYapildiMi}
                onChange={(e) => handleFormChange('aracAramaYapildiMi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Ceza tutanağına imza attınız mı?"
                value={formData.tutanakImzaAtildiMi}
                onChange={(e) => handleFormChange('tutanakImzaAtildiMi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Video/ses kaydı mevcut mu?"
                value={formData.videoSesKaydiMevcutMu}
                onChange={(e) => handleFormChange('videoSesKaydiMevcutMu', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Sorgu esnasında araçtan indirildiniz mi?"
                value={formData.sorguEsnasindaAractanIndirildiMi}
                onChange={(e) => handleFormChange('sorguEsnasindaAractanIndirildiMi', e.target.value)}
                size="small"
              />
              <TextField
                fullWidth
                label="Zorla tutanak imzalattılar mı?"
                value={formData.zorlaTutanakImzalattilarMi}
                onChange={(e) => handleFormChange('zorlaTutanakImzalattilarMi', e.target.value)}
                size="small"
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Sağ Sütun - Sorular (Scroll Var) */}
        <Grid item xs={12} md={9}>
          <Paper elevation={2} sx={{ p: 2, position: 'relative', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            {loading && (
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <CircularProgress size={32} />
              </Box>
            )}
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: 600, fontSize: '0.95rem' }}>
              Sorular ve Cevaplar
            </Typography>
            <Grid container spacing={1.5}>
              {questions.map((question) => (
                <Grid item xs={12} sm={6} key={question.id}>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight="medium" sx={{ mb: 0.5, fontSize: '0.75rem', display: 'block' }}>
                      {question.id}. {question.question}
                    </Typography>
                    {renderAnswerField(question)}
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <TextField
              fullWidth
              multiline
              rows={4}
              size="small"
              label="NOT (Ek bilgiler)"
              value={formData.not}
              onChange={(e) => handleFormChange('not', e.target.value)}
              placeholder="Ek notlarınızı buraya yazabilirsiniz..."
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="outlined" startIcon={<Save />} onClick={handleSubmit}>
                Kaydet
              </Button>
              <Button variant="contained" startIcon={<Send />} onClick={handleSubmit}>
                Gönder
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Oluşturulan Metin Bölümü */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Oluşturulan Beyan Metni
          </Typography>
          <Button
            variant="contained"
            startIcon={copied ? <CheckCircle /> : <ContentCopy />}
            onClick={handleCopy}
          >
            {copied ? 'Kopyalandı!' : 'Kopyala'}
          </Button>
        </Box>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', maxHeight: 400, overflowY: 'auto' }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {generateBeyanText()}
          </Typography>
        </Paper>
        {copied && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Metin panoya kopyalandı!
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default Beyanmatik;
