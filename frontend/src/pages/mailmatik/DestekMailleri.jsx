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
} from '@mui/material';
import { Support, ContentCopy, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const DestekMailleri = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({});
  const { user } = useAuth();

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
      generate: (data) => `SAAT FARKI MAİLİ:
 
Merhaba,
 
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
      ],
      generate: (data) => `2. CEZA DESTEK MAİLİ
 
Merhaba,
 
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
 
KONU: Yeni süreç cezası. Gerekli kontroller sağlandığında makbuzdaki ceza tutarı 92784 TL'dir. İlk cezası 17.03.2024 tarihinde uygulanmış. Sürücünün cezası ödenmiş. İkinci cezasında makbuzdaki bilgiler ile sistemdeki bilgiler uyuşmaktadır.  
 
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
      generate: (data) => `KOD ALINMADAN (EŞLEŞMEDE) YOLCULUK DESTEK MAİLİ;
 
Merhaba,
 
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
      generate: (data) => `PLAKA FARKLI DESTEK MAİLİ;
 
Merhaba,
 
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

Konu: Sistemde kayıtlı plaka(${data.sistemPlaka || ''}) ile makbuzdaki plaka(${data.makbuzPlaka || ''}) farklı. Sistemde kayıtlı olan araç(${data.sistemArac || ''}) ile cezai işlem uygulanan araç(${data.cezaArac || ''}) model yılı uyuşmuyor. Cezai işlem uygulanan plaka sisteme kayıtlı, reddedilmiş veya başvuru sürecinde değil. Aylık ortalama yolculuk sayısı olarak hesaplandığında 100 yolculuğu geçiyor. 
 
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
    
    return lines.map((line, lineIdx) => {
      // Her satırı kontrol et ve field'ları bul
      const field = currentTemplate.fields.find(f => {
        const fieldPattern = new RegExp(`${f.label}:\\s*`, 'i');
        return fieldPattern.test(line);
      });

      if (field) {
        const parts = line.split(new RegExp(`(${field.label}:\\s*)`, 'i'));
        if (parts.length >= 3) {
          const labelPart = parts[1];
          const valuePart = parts.slice(2).join('');
          const isEmpty = !currentData[field.key] || currentData[field.key].trim() === '';
          
          return (
            <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography component="span" variant="body2" sx={{ minWidth: 'fit-content' }}>
                {labelPart}
              </Typography>
              <TextField
                size="small"
                value={currentData[field.key] || ''}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.label}
                sx={{
                  flex: 1,
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    height: '28px',
                    fontSize: '0.8rem',
                  },
                }}
              />
              {field.required && isEmpty && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.7rem',
                    color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706',
                    fontStyle: 'italic',
                    ml: 0.5,
                  }}
                >
                  (boş)
                </Typography>
              )}
            </Box>
          );
        }
      }
      
      // Özel durumlar: Yolcu beyanı, Sürücü beyanı gibi tırnak içindeki alanlar
      const specialFields = [
        { key: 'yolcuBeyani', pattern: /Yolcu beyanı alındığında; "([^"]*)"/i },
        { key: 'surucuBeyani', pattern: /Sürücü beyanında; "([^"]*)"/i },
        { key: 'yolcuBeyaniKod', pattern: /Yolcu beyanında; "([^"]*)"/i },
      ];

      for (const specialField of specialFields) {
        const match = line.match(specialField.pattern);
        if (match) {
          const field = currentTemplate.fields.find(f => f.key === specialField.key);
          if (field) {
            const isEmpty = !currentData[field.key] || currentData[field.key].trim() === '';
            const beforeQuote = line.substring(0, line.indexOf('"'));
            const afterQuote = line.substring(line.lastIndexOf('"') + 1);
            
            return (
              <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography component="span" variant="body2">
                  {beforeQuote}"
                </Typography>
                <TextField
                  size="small"
                  value={currentData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.label}
                  sx={{
                    flex: 1,
                    minWidth: 180,
                    '& .MuiOutlinedInput-root': {
                      height: '28px',
                      fontSize: '0.8rem',
                    },
                  }}
                />
                <Typography component="span" variant="body2">
                  "{afterQuote}
                </Typography>
                {field.required && isEmpty && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7rem',
                      color: '#8B4513',
                      fontStyle: 'italic',
                      ml: 0.5,
                    }}
                  >
                    (boş)
                  </Typography>
                )}
              </Box>
            );
          }
        }
      }
      
      return (
        <Typography key={lineIdx} variant="body2" sx={{ mb: line.trim() === '' ? 0.5 : 0 }}>
          {line || '\u00A0'}
        </Typography>
      );
    });
  };

  return (
    <Container maxWidth="lg">
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Support sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Destek Mailleri
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={selectedTemplate}
            onChange={(e, newValue) => setSelectedTemplate(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
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
                  fontSize: '0.875rem',
                  minWidth: { xs: 80, sm: 120 },
                  px: { xs: 1, sm: 2 },
                  whiteSpace: 'nowrap',
                }} 
              />
            ))}
          </Tabs>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {currentTemplate.name}
          </Typography>

          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
              Mail İçeriği:
            </Typography>
            <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.8 }}>
              {renderMailContent()}
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={copied ? <CheckCircle /> : <ContentCopy />}
              onClick={handleCopy}
            >
              {copied ? 'Kopyalandı!' : 'Kopyala'}
            </Button>
          </Box>

          {copied && (
            <Alert severity="success">Mail içeriği panoya kopyalandı!</Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default DestekMailleri;
