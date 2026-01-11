import { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Support, ContentCopy, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const DestekMailleri = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({});
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const templates = [
    {
      name: 'Saat Farkı Maili',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'cezaTarihi', label: 'Ceza tarihi', required: true },
        { key: 'cezaKonum', label: 'Cezai işlem uygulanan konum', required: true },
        { key: 'tripId', label: 'Trip ID', required: true },
        { key: 'makbuzSaati', label: 'Makbuz Saati', required: true },
        { key: 'surucuId', label: 'Sürücü ID', required: true },
        { key: 'surucuIsmi', label: 'Sürücü ismi', required: true },
        { key: 'surucuTel', label: 'Sürücü tel no', required: true },
        { key: 'surucuKayitTarihi', label: 'Sürücü kayıt tarihi', required: true },
        { key: 'aracMarkaModel', label: 'Sistemde kayıtlı araç marka / model', required: true },
        { key: 'aracPlaka', label: 'Sisteme kayıtlı araç plaka', required: true },
        { key: 'yolculukSayisi', label: 'Sürücü yolculuk sayısı', required: true },
        { key: 'surucuRating', label: 'Sürücü rating', required: true },
        { key: 'yolcuBeyani', label: 'Yolcu beyanı', required: true },
        { key: 'yolculukBitisSaati', label: 'Yolculuk bitiş saati', required: true },
        { key: 'yolculukBitisNoktasi', label: 'Yolculuk bitiş noktası', required: true },
        { key: 'saatFarki', label: 'Saat farkı', required: true },
        { key: 'dakikaFarki', label: 'Dakika farkı', required: true },
      ],
      generate: (data) => `Merhaba,
 
Ceza no: ${data.cezaNo || ''}
Ceza tarihi: ${data.cezaTarihi || ''}
Cezai işlem uygulanan konum: ${data.cezaKonum || ''}
Trip ID: ${data.tripId || ''}
Makbuz Saati: ${data.makbuzSaati || ''}


Sürücü Bilgileri:
Sürücü ID: ${data.surucuId || ''}
Sürücü ismi: ${data.surucuIsmi || ''}
Sürücü tel no: ${data.surucuTel || ''}
Sürücü kayıt tarihi: ${data.surucuKayitTarihi || ''}
Sistemde kayıtlı araç marka / model: ${data.aracMarkaModel || ''}
Sisteme kayıtlı araç plaka: ${data.aracPlaka || ''}
Sürücü yolculuk sayısı: ${data.yolculukSayisi || ''}
Sürücü rating: ${data.surucuRating || ''}
 

KONU: 
Sürücünün sisteme kayıtlı bilgileriyle makbuzdaki bilgileri uyuşuyor. Fakat ceza makbuzunda belirtilen tarih ve saat kontrolü yapıldığında bahsetmiş olduğu yolculukla arasında saat farkı olduğu tespit edildi.
 
Yolcu beyanı alındığında; "${data.yolcuBeyani || ''}"
 
Yolculuk bitiş saati ${data.yolculukBitisSaati || ''}, makbuzdaki saat ${data.makbuzSaati || ''}'dir. Cezai işlem uygulanan konum ${data.cezaKonum || ''}, sistemde yolculuğun bitiş noktası ${data.yolculukBitisNoktasi || ''}. Arada ${data.saatFarki || ''} saat ${data.dakikaFarki || ''} dakikaya yakın bir fark bulunmakta ve makbuzdaki konum ile sistemdeki yolculuk bitiş noktası uyuşmuyor.
 
Ceza makbuzu ve yolculuğa dair detaylar ektedir.
 
Destek sağlanıp, sağlanmaması konusunda desteğinizi arz ederim.
 
Bilginize,`
    },
    {
      name: 'Ceza Destek Maili',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'cezaTarihi', label: 'Ceza tarihi', required: true },
        { key: 'cezaKonum', label: 'Cezai işlem uygulanan konum', required: true },
        { key: 'tripId', label: 'Trip ID', required: true },
        { key: 'makbuzSaati', label: 'Makbuz Saati', required: true },
        { key: 'surucuId', label: 'Sürücü ID', required: true },
        { key: 'surucuIsmi', label: 'Sürücü ismi', required: true },
        { key: 'surucuTel', label: 'Sürücü tel no', required: true },
        { key: 'surucuKayitTarihi', label: 'Sürücü kayıt tarihi', required: true },
        { key: 'aracMarkaModel', label: 'Sistemde kayıtlı araç marka / model', required: true },
        { key: 'aracPlaka', label: 'Sisteme kayıtlı araç plaka', required: true },
        { key: 'yolculukSayisi', label: 'Sürücü yolculuk sayısı', required: true },
        { key: 'surucuRating', label: 'Sürücü rating', required: true },
        { key: 'cezaTutari', label: 'Ceza tutarı (TL)', required: true },
        { key: 'ilkCezaTarihi', label: 'İlk ceza tarihi', required: true },
        { key: 'aracBilgisi', label: 'Sistemde kayıtlı olan araç', required: true },
      ],
      generate: (data) => `Merhaba,
 
Ceza no: ${data.cezaNo || ''}
Ceza tarihi: ${data.cezaTarihi || ''}
Cezai işlem uygulanan konum: ${data.cezaKonum || ''}
Trip ID: ${data.tripId || ''}
Makbuz Saati: ${data.makbuzSaati || ''}
 
Sürücü Bilgileri:
Sürücü ID: ${data.surucuId || ''}
Sürücü ismi: ${data.surucuIsmi || ''}
Sürücü tel no: ${data.surucuTel || ''}
Sürücü kayıt tarihi: ${data.surucuKayitTarihi || ''}
Sistemde kayıtlı araç marka / model: ${data.aracMarkaModel || ''}
Sisteme kayıtlı araç plaka: ${data.aracPlaka || ''}
Sürücü yolculuk sayısı: ${data.yolculukSayisi || ''}
Sürücü rating: ${data.surucuRating || ''}
 
KONU: Yeni süreç cezası. Gerekli kontroller sağlandığında makbuzdaki ceza tutarı ${data.cezaTutari || '___CEZA_TUTARI___'}TL'dir. İlk cezası ${data.ilkCezaTarihi || '___ILK_CEZA_TARIHI___'} tarihinde uygulanmış. Sürücünün cezası ödenmiş. İkinci cezasında makbuzdaki bilgiler ile sistemdeki bilgiler uyuşmaktadır. Sistemde kayıtlı olan araç(${data.aracBilgisi || '___ARAC_BILGISI___'}).
 
Ceza ödemesinde ne kadar destek sağlanacağı konusunda desteğinizi arz ederiz.
 
Teşekkürler,`
    },
    {
      name: 'Kod Alınmadan Yolculuk Destek Maili',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'cezaTarihi', label: 'Ceza tarihi', required: true },
        { key: 'cezaKonum', label: 'Cezai işlem uygulanan konum', required: true },
        { key: 'eslesmeSaati', label: 'Eşleşme Saati', required: true },
        { key: 'eslesmeId', label: 'Eşleşme ID', required: true },
        { key: 'makbuzSaati', label: 'Makbuz Saati', required: true },
        { key: 'surucuId', label: 'Sürücü ID', required: true },
        { key: 'surucuIsmi', label: 'Sürücü ismi', required: true },
        { key: 'surucuTel', label: 'Sürücü tel no', required: true },
        { key: 'surucuKayitTarihi', label: 'Sürücü kayıt tarihi', required: true },
        { key: 'aracMarkaModel', label: 'Sistemde kayıtlı araç marka / model', required: true },
        { key: 'aracPlaka', label: 'Sisteme kayıtlı araç plaka', required: true },
        { key: 'yolculukSayisi', label: 'Sürücü yolculuk sayısı', required: true },
        { key: 'surucuRating', label: 'Sürücü rating', required: true },
        { key: 'surucuBeyani', label: 'Sürücü beyanı', required: true },
        { key: 'yolcuBeyaniKod', label: 'Yolcu beyanı', required: true },
      ],
      generate: (data) => `Merhaba,
 
Ceza no: ${data.cezaNo || ''}
Ceza tarihi: ${data.cezaTarihi || ''}
Cezai işlem uygulanan konum: ${data.cezaKonum || ''}
Eşleşme Saati: ${data.eslesmeSaati || ''}
Eşleşme ID: ${data.eslesmeId || ''}
Makbuz Saati: ${data.makbuzSaati || ''}
 
Sürücü Bilgileri:
Sürücü ID: ${data.surucuId || ''}
Sürücü ismi: ${data.surucuIsmi || ''}
Sürücü tel no: ${data.surucuTel || ''}
Sürücü kayıt tarihi: ${data.surucuKayitTarihi || ''}
Sistemde kayıtlı araç marka / model: ${data.aracMarkaModel || ''}
Sisteme kayıtlı araç plaka: ${data.aracPlaka || ''}
Sürücü yolculuk sayısı: ${data.yolculukSayisi || ''}
Sürücü rating: ${data.surucuRating || ''}
 
Konu: Sistemde kayıtlı plaka ile makbuzdaki plaka uyumlu.  Aylık ortalama yolculuk sayısı 100 yolculuğu geçmiyor.
 
Hakkında daha önce görüşme notu - uyarısı bulunmuyor.
 
Kod alınmadan (eşleşmede) yolculuk yapılmış.
 
Sürücü beyanında; "${data.surucuBeyani || ''}" dedi.
 
Yolcu beyanı mevcut makbuz yok.
 
Yolcu beyanında; "${data.yolcuBeyaniKod || ''}" dedi.
 
Destek sağlanıp, sağlanmaması konusunda desteğinizi arz ederim.
 
Bilginize,`
    },
    {
      name: 'Plaka Farklı Destek Maili',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'cezaTarihi', label: 'Ceza tarihi', required: true },
        { key: 'cezaKonum', label: 'Cezai işlem uygulanan konum', required: true },
        { key: 'tripId', label: 'Trip ID', required: true },
        { key: 'makbuzSaati', label: 'Makbuz Saati', required: true },
        { key: 'surucuId', label: 'Sürücü ID', required: true },
        { key: 'surucuIsmi', label: 'Sürücü ismi', required: true },
        { key: 'surucuTel', label: 'Sürücü tel no', required: true },
        { key: 'surucuKayitTarihi', label: 'Sürücü kayıt tarihi', required: true },
        { key: 'aracMarkaModel', label: 'Sistemde kayıtlı araç marka / model', required: true },
        { key: 'sistemPlaka', label: 'Sisteme kayıtlı araç plaka', required: true },
        { key: 'yolculukSayisi', label: 'Sürücü yolculuk sayısı', required: true },
        { key: 'surucuRating', label: 'Sürücü rating', required: true },
        { key: 'makbuzPlaka', label: 'Makbuz plaka', required: true },
        { key: 'sistemArac', label: 'Sistem araç', required: true },
        { key: 'cezaArac', label: 'Ceza araç', required: true },
      ],
      generate: (data) => `Merhaba,
 
Ceza no: ${data.cezaNo || ''}
Ceza tarihi: ${data.cezaTarihi || ''}
Cezai işlem uygulanan konum: ${data.cezaKonum || ''}
Trip ID: ${data.tripId || ''}
Makbuz Saati: ${data.makbuzSaati || ''}
 
Sürücü Bilgileri: 
Sürücü ID: ${data.surucuId || ''}
Sürücü ismi: ${data.surucuIsmi || ''}
Sürücü tel no: ${data.surucuTel || ''}
Sürücü kayıt tarihi: ${data.surucuKayitTarihi || ''}
Sistemde kayıtlı araç marka / model: ${data.aracMarkaModel || ''}
Sisteme kayıtlı araç plaka: ${data.sistemPlaka || ''}
Sürücü yolculuk sayısı: ${data.yolculukSayisi || ''}
Sürücü rating: ${data.surucuRating || ''}

Konu: Sistemde kayıtlı plaka(${data.sistemPlaka || '___SISTEM_PLAKA___'}) ile makbuzdaki plaka(${data.makbuzPlaka || '___MAKBUZ_PLAKA___'}) farklı. Sistemde kayıtlı olan araç(${data.sistemArac || '___SISTEM_ARAC___'}) ile cezai işlem uygulanan araç(${data.cezaArac || '___CEZA_ARAC___'}) model yılı uyuşmuyor. Cezai işlem uygulanan plaka sisteme kayıtlı, reddedilmiş veya başvuru sürecinde değil. Aylık ortalama yolculuk sayısı olarak hesaplandığında 100 yolculuğu geçiyor. 
 
Hakkında daha önce görüşme notu-uyarı bulunmuyor.  
 
Destek sağlanıp, sağlanmaması konusunda desteğinizi arz ederim.

Teşekkürler,`
    },
  ];

  const currentTemplate = templates[selectedTemplate];
  const currentData = formData[selectedTemplate] || {};

  const handleInputChange = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [selectedTemplate]: {
        ...prev[selectedTemplate],
        [fieldKey]: value,
      },
    }));
  };

  const handleCopy = async () => {
    const mailContent = currentTemplate.generate(currentData);
    navigator.clipboard.writeText(mailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Database'e kaydet
    try {
      await axios.post('/api/logs/mail-copy', {
        mailType: currentTemplate.name,
        mailContent: mailContent.substring(0, 500), // İlk 500 karakter
      });
    } catch (err) {
      // Sessizce hata yut, kullanıcıyı rahatsız etme
      if (import.meta.env.DEV) {
        console.error('Error logging mail copy:', err);
      }
    }
  };


  const renderMailContent = () => {
    const content = currentTemplate.generate(currentData);
    const lines = content.split('\n');
    const processedLines = new Set();
    
    return lines.map((line, lineIdx) => {
      if (processedLines.has(lineIdx)) return null;
      if (!line.trim()) {
        return (
          <Typography key={lineIdx} variant="body2" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {'\u00A0'}
          </Typography>
        );
      }
      
      // 1. Label pattern kontrolü (Ceza no:, Plaka: vb.)
      const labelField = currentTemplate.fields.find(f => {
        const pattern = new RegExp(`${f.label}:\\s*`, 'i');
        return pattern.test(line);
      });

      if (labelField) {
        processedLines.add(lineIdx);
        const parts = line.split(new RegExp(`(${labelField.label}:\\s*)`, 'i'));
        if (parts.length >= 3) {
          const isEmpty = !currentData[labelField.key] || currentData[labelField.key].trim() === '';
          return (
            <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
              <Typography component="span" variant="body2" sx={{ minWidth: 'fit-content', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {parts[1]}
              </Typography>
              <TextField
                size="small"
                value={currentData[labelField.key] || ''}
                onChange={(e) => handleInputChange(labelField.key, e.target.value)}
                placeholder={labelField.label}
                sx={{
                  flex: 1,
                  minWidth: { xs: 150, sm: 180 },
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  },
                }}
              />
              {labelField.required && isEmpty && (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706', fontStyle: 'italic', ml: 0.5 }}>
                  (boş)
                </Typography>
              )}
            </Box>
          );
        }
      }
      
      // 2. Tırnak içindeki alanlar (Yolcu beyanı, Sürücü beyanı)
      const quoteFields = [
        { key: 'yolcuBeyani', pattern: /Yolcu beyanı alındığında; "([^"]*)"/i },
        { key: 'surucuBeyani', pattern: /Sürücü beyanında; "([^"]*)"/i },
        { key: 'yolcuBeyaniKod', pattern: /Yolcu beyanında; "([^"]*)"/i },
      ];
      
      for (const quoteField of quoteFields) {
        const match = line.match(quoteField.pattern);
        if (match) {
          const field = currentTemplate.fields.find(f => f.key === quoteField.key);
          if (field && !processedLines.has(lineIdx)) {
            processedLines.add(lineIdx);
            const isEmpty = !currentData[field.key] || currentData[field.key].trim() === '';
            const beforeQuote = line.substring(0, line.indexOf('"'));
            const afterQuote = line.substring(line.lastIndexOf('"') + 1);
            
            return (
              <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {beforeQuote}"
                </Typography>
                <TextField
                  size="small"
                  multiline
                  rows={1}
                  value={currentData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.label}
                  sx={{
                    flex: 1,
                    minWidth: { xs: 150, sm: 180 },
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      minHeight: '28px',
                    },
                  }}
                />
                <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  "{afterQuote}
                </Typography>
                {field.required && isEmpty && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706', fontStyle: 'italic', ml: 0.5 }}>
                    (boş)
                  </Typography>
                )}
              </Box>
            );
          }
        }
      }
      
      // 3. Konu kısımlarındaki değişkenler - Placeholder pattern
      for (const field of currentTemplate.fields) {
        const fieldValue = currentData[field.key] || '';
        const isEmpty = !fieldValue || fieldValue.trim() === '';
        
        // Placeholder pattern: ___FIELD_KEY___
        const placeholderPattern = new RegExp(`___${field.key.toUpperCase()}___`, 'g');
        if (line.match(placeholderPattern) && !processedLines.has(lineIdx)) {
          processedLines.add(lineIdx);
          const parts = line.split(placeholderPattern);
          return (
            <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
              <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {parts[0]}
              </Typography>
              <TextField
                size="small"
                value={fieldValue}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.label}
                sx={{
                  minWidth: { xs: 100, sm: 120 },
                  flex: field.key.includes('Tutari') || field.key.includes('Tarihi') ? '0 0 auto' : 1,
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  },
                }}
              />
              <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {parts.slice(1).join('')}
              </Typography>
              {field.required && isEmpty && (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706', fontStyle: 'italic', ml: 0.5 }}>
                  (boş)
                </Typography>
              )}
            </Box>
          );
        }
        
        // Parantez içindeki değişkenler: (x)
        if (fieldValue && line.includes(`(${fieldValue})`) && !processedLines.has(lineIdx)) {
          processedLines.add(lineIdx);
          const beforeMatch = line.substring(0, line.indexOf(`(${fieldValue})`));
          const afterMatch = line.substring(line.indexOf(`(${fieldValue})`) + `(${fieldValue})`.length);
          
          return (
            <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
              <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {beforeMatch}(
              </Typography>
              <TextField
                size="small"
                value={fieldValue}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.label}
                sx={{
                  minWidth: { xs: 100, sm: 120 },
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  },
                }}
              />
              <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                ){afterMatch}
              </Typography>
              {field.required && isEmpty && (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706', fontStyle: 'italic', ml: 0.5 }}>
                  (boş)
                </Typography>
              )}
            </Box>
          );
        }
        
        // TL içeren kısımlar: "xxxTL'dir"
        if (field.key === 'cezaTutari' && line.includes('TL') && !processedLines.has(lineIdx)) {
          if (fieldValue && line.includes(`${fieldValue}TL`)) {
            processedLines.add(lineIdx);
            const beforeTL = line.substring(0, line.indexOf(`${fieldValue}TL`));
            const afterTL = line.substring(line.indexOf(`${fieldValue}TL`) + `${fieldValue}TL`.length);
            
            return (
              <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {beforeTL}
                </Typography>
                <TextField
                  size="small"
                  value={fieldValue}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.label}
                  sx={{
                    minWidth: { xs: 100, sm: 120 },
                    '& .MuiOutlinedInput-root': {
                      height: '28px',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    },
                  }}
                />
                <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {afterTL}
                </Typography>
                {field.required && isEmpty && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706', fontStyle: 'italic', ml: 0.5 }}>
                    (boş)
                  </Typography>
                )}
              </Box>
            );
          }
        }
        
        // Tarih içeren kısımlar: "xx.xx.xxxx tarihinde"
        if (field.key === 'ilkCezaTarihi' && line.includes('tarihinde') && !processedLines.has(lineIdx)) {
          if (fieldValue && line.includes(fieldValue)) {
            processedLines.add(lineIdx);
            const beforeDate = line.substring(0, line.indexOf(fieldValue));
            const afterDate = line.substring(line.indexOf(fieldValue) + fieldValue.length);
            
            return (
              <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {beforeDate}
                </Typography>
                <TextField
                  size="small"
                  value={fieldValue}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.label}
                  sx={{
                    minWidth: { xs: 100, sm: 120 },
                    '& .MuiOutlinedInput-root': {
                      height: '28px',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    },
                  }}
                />
                <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {afterDate}
                </Typography>
                {field.required && isEmpty && (
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706', fontStyle: 'italic', ml: 0.5 }}>
                    (boş)
                  </Typography>
                )}
              </Box>
            );
          }
        }
      }
      
      // Normal metin satırı
      return (
        <Typography key={lineIdx} variant="body2" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
          {line}
        </Typography>
      );
    }).filter(Boolean);
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 }, py: { xs: 2, sm: 3 } }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
          <Support sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Destek Mailleri
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: { xs: 2, sm: 3 }, overflowX: 'auto' }}>
          <Tabs
            value={selectedTemplate}
            onChange={(e, newValue) => setSelectedTemplate(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              minHeight: { xs: 40, sm: 48 },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              },
            }}
          >
            {templates.map((template, index) => (
              <Tab 
                key={index} 
                label={template.name} 
                sx={{ 
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 80, sm: 120 },
                  px: { xs: 1, sm: 2 },
                  whiteSpace: 'nowrap',
                }} 
              />
            ))}
          </Tabs>
        </Box>

        <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

        <Stack spacing={{ xs: 2, sm: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {currentTemplate.name}
          </Typography>

          <Paper 
            variant="outlined" 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              overflowX: 'auto',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: { xs: 1.5, sm: 2 }, fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Mail İçeriği:
            </Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.8, wordBreak: 'break-word' }}>
              {renderMailContent()}
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: { xs: 'center', sm: 'flex-end' }, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={copied ? <CheckCircle /> : <ContentCopy />}
              onClick={handleCopy}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'large'}
            >
              {copied ? 'Kopyalandı!' : 'Kopyala'}
            </Button>
          </Box>

          {copied && (
            <Alert severity="success" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Mail içeriği panoya kopyalandı!</Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default DestekMailleri;
