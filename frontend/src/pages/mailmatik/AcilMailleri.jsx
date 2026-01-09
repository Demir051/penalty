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
} from '@mui/material';
import { Warning, ContentCopy, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AcilMailleri = () => {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({});
  const { user } = useAuth();
  
  const fields = [
    { key: 'cezaNo', label: 'Ceza no', required: true },
    { key: 'cezaTarihi', label: 'Ceza tarihi', required: true },
    { key: 'cezaKonum', label: 'Cezai işlem uygulanan konum', required: true },
    { key: 'tripId', label: 'Trip ID', required: true },
    { key: 'hukukBurosu', label: 'Hukuk Bürosu', required: false },
    { key: 'makbuzSaati', label: 'Makbuz Saati', required: true },
    { key: 'surucuId', label: 'Sürücü ID', required: true },
    { key: 'surucuIsmi', label: 'Sürücü ismi', required: true },
    { key: 'surucuTel', label: 'Sürücü tel no', required: true },
    { key: 'surucuKayitTarihi', label: 'Sürücü kayıt tarihi', required: true },
    { key: 'aracMarkaModel', label: 'Sistemde kayıtlı araç marka / model', required: true },
    { key: 'aracPlaka', label: 'Sisteme kayıtlı araç plaka', required: true },
    { key: 'yolculukSayisi', label: 'Sürücü yolculuk sayısı', required: true },
    { key: 'surucuRating', label: 'Sürücü rating', required: true },
    { key: 'konu', label: 'KONU', required: true },
  ];

  const generateMail = (data) => {
    let mail = `ACİL MAİLİ;
 
Merhaba,
 
Ceza no: ${data.cezaNo || ''}
Ceza tarihi: ${data.cezaTarihi || ''}
Cezai işlem uygulanan konum: ${data.cezaKonum || ''}
Trip ID: ${data.tripId || ''}`;

    if (data.hukukBurosu) {
      mail += `
Hukuk Bürosu: ${data.hukukBurosu}`;
    }

    mail += `
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
 
KONU: ${data.konu || ''}
 
Bilginize,`;

    return mail;
  };

  const handleInputChange = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleCopy = async () => {
    const mailContent = generateMail(formData);
    navigator.clipboard.writeText(mailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Database'e kaydet
    try {
      await axios.post('/api/logs/mail-copy', {
        mailType: 'Acil Maili',
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
    const content = generateMail(formData);
    const lines = content.split('\n');
    
    return lines.map((line, lineIdx) => {
      // Her satırı kontrol et ve field'ları bul
      const field = fields.find(f => {
        const fieldPattern = new RegExp(`${f.label}:\\s*`, 'i');
        return fieldPattern.test(line);
      });

      if (field) {
        const parts = line.split(new RegExp(`(${field.label}:\\s*)`, 'i'));
        if (parts.length >= 3) {
          const labelPart = parts[1];
          const valuePart = parts.slice(2).join('');
          const isEmpty = !formData[field.key] || formData[field.key].trim() === '';
          
          return (
            <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography component="span" variant="body2" sx={{ minWidth: 'fit-content' }}>
                {labelPart}
              </Typography>
              <TextField
                size="small"
                value={formData[field.key] || ''}
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
          <Warning sx={{ fontSize: 32, color: 'error.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Acil Mailleri
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Acil Mail Şablonu
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

export default AcilMailleri;
