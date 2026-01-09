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
import { Payment, ContentCopy, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const OdemeMailleri = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({});
  const { user } = useAuth();
  
  const templates = [
    {
      name: 'Ceza Ödemesi (Tarafımızca) - Sürücü',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'plaka', label: 'Plaka', required: true },
        { key: 'surucuAdi', label: 'Sürücü Adı', required: true },
      ],
      generate: (data) => `Ceza Ödemesi (${data.cezaNo || ''}) - Sürücü

Merhaba,

Ekte makbuzunu ilettiğim ${data.plaka || ''} plakalı aracın sürücüsü ${data.surucuAdi || ''} ceza ödemesinin gerçekleştirilmesini rica ederim.

Teşekkürler,`
    },
    {
      name: 'Ceza Ödemesi (Havale) - Sürücü',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'surucuAdi', label: 'Sürücü Adı', required: true },
        { key: 'iban', label: 'İBAN', required: true },
      ],
      generate: (data) => `Ceza Ödemesi (${data.cezaNo || ''}) - Sürücü

Merhaba,

Ekte makbuz ve dekontunu ilettiğim sürücü ${data.surucuAdi || ''} ödemesini kendisi gerçekleştirmiştir. Aşağıda ilettiğim banka bilgileri aracılığı ile ödenen cezanın iadesinin yapılmasını rica ederim.

Teşekkürler,

İBAN:
${data.iban || ''}`
    },
    {
      name: 'Ceza Ödemesi - Yolcu (Tarafımızca)',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'plaka', label: 'Plaka', required: true },
        { key: 'yolcuAdi', label: 'Yolcu Adı', required: true },
      ],
      generate: (data) => `Ceza Ödemesi (${data.cezaNo || ''}) - Yolcu

Merhaba, 

Ekte makbuzunu ilettiğim ${data.plaka || ''} plakalı aracın yolcusu ${data.yolcuAdi || ''} ceza ödemesinin gerçekleştirilmesini rica ederim. 

Teşekkürler,`
    },
    {
      name: 'Ceza Ödemesi - Yolcu (Kendi Ödedi)',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'yolcuAdi', label: 'Yolcu Adı', required: true },
        { key: 'iban', label: 'İBAN', required: true },
      ],
      generate: (data) => `Ceza Ödemesi (${data.cezaNo || ''}) - Yolcu

Merhaba,

Ekte makbuz ve dekontunu ilettiğim yolcu ${data.yolcuAdi || ''} ceza ödemesini kendisi gerçekleştirmiştir. Aşağıda ilettiğim banka bilgileri aracılığı ile ceza ödemesinin yapılmasını rica ederim.

Teşekkürler,

İBAN:
${data.iban || ''}`
    },
    {
      name: 'Otopark Ödemesi - Sürücü',
      fields: [
        { key: 'plaka', label: 'Plaka', required: true },
        { key: 'surucuAdi', label: 'Sürücü Adı', required: true },
        { key: 'iban', label: 'İBAN', required: true },
      ],
      generate: (data) => `Otopark Ödemesi (${data.plaka || ''}) - Sürücü

Merhaba,

Ekte makbuz ve dekontunu ilettiğim sürücü ${data.surucuAdi || ''} otopark ödemesini kendisi gerçekleştirmiştir. Aşağıda ilettiğim banka bilgileri aracılığı ile otopark ödemesinin yapılmasını rica ederim.

Teşekkürler,

İBAN:
${data.iban || ''}`
    },
    {
      name: 'Otopark ve Çekici Ödemesi - Sürücü',
      fields: [
        { key: 'plaka', label: 'Plaka', required: true },
        { key: 'surucuAdi', label: 'Sürücü Adı', required: true },
        { key: 'iban', label: 'İBAN', required: true },
      ],
      generate: (data) => `Otopark ve Çekici Ödemesi (${data.plaka || ''}) - Sürücü

Merhaba,

Ekte makbuz ve dekontunu ilettiğim sürücü ${data.surucuAdi || ''} otopark ve çekici ödemesini kendisi gerçekleştirmiştir. Aşağıda ilettiğim banka bilgileri aracılığı ile otopark ve çekici ödemesinin yapılmasını rica ederim.

Teşekkürler,

İBAN:
${data.iban || ''}`
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
    
    // Template'deki field pozisyonlarını belirle (boş değerler için)
    const getTemplateWithPlaceholder = (fieldKey, placeholder = '___INPUT___') => {
      const testData = { ...currentData, [fieldKey]: placeholder };
      return currentTemplate.generate(testData).split('\n');
    };
    
    return lines.map((line, lineIdx) => {
      // Önce label pattern'leri kontrol et (Ceza no:, Plaka: gibi)
      const field = currentTemplate.fields.find(f => {
        const fieldPattern = new RegExp(`${f.label}:\\s*`, 'i');
        return fieldPattern.test(line);
      });

      if (field) {
        const parts = line.split(new RegExp(`(${field.label}:\\s*)`, 'i'));
        if (parts.length >= 3) {
          const labelPart = parts[1];
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

      // Mail içeriğindeki field değerlerini bul ve inline editing yap
      for (const field of currentTemplate.fields) {
        const fieldValue = currentData[field.key] || '';
        const isEmpty = !fieldValue || fieldValue.trim() === '';
        
        // Eğer field değeri boş değilse ve satırda geçiyorsa
        if (fieldValue && line.includes(fieldValue)) {
          // Parantez içindeki değerleri kontrol et: "Ceza Ödemesi (xxx)"
          const escapedValue = fieldValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const parenthesisMatch = line.match(new RegExp(`\\(\\s*${escapedValue}\\s*\\)`, 'i'));
          if (parenthesisMatch) {
            const beforeMatch = line.substring(0, line.indexOf(parenthesisMatch[0]));
            const afterMatch = line.substring(line.indexOf(parenthesisMatch[0]) + parenthesisMatch[0].length);
            
            return (
              <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography component="span" variant="body2">
                  {beforeMatch}(
                </Typography>
                <TextField
                  size="small"
                  value={fieldValue}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.label}
                  sx={{
                    minWidth: 120,
                    '& .MuiOutlinedInput-root': {
                      height: '28px',
                      fontSize: '0.8rem',
                    },
                  }}
                />
                <Typography component="span" variant="body2">
                  ){afterMatch}
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
          
          // Doğrudan değişken kullanımı: "xxx plakalı" veya "sürücü xxx ödemesini"
          const valueIndex = line.indexOf(fieldValue);
          if (valueIndex !== -1) {
            const beforeValue = line.substring(0, valueIndex);
            const afterValue = line.substring(valueIndex + fieldValue.length);
            
            // Eğer bu değer zaten label pattern'inin parçası değilse
            if (!beforeValue.match(/:\s*$/)) {
              return (
                <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography component="span" variant="body2">
                    {beforeValue}
                  </Typography>
                  <TextField
                    size="small"
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.label}
                    sx={{
                      minWidth: 120,
                      '& .MuiOutlinedInput-root': {
                        height: '28px',
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                  <Typography component="span" variant="body2">
                    {afterValue}
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
        } else if (isEmpty) {
          // Field boşsa, template'deki pozisyonu bul
          const templateLines = getTemplateWithPlaceholder(field.key);
          const templateLine = templateLines[lineIdx];
          
          if (templateLine && templateLine.includes('___INPUT___')) {
            // Parantez içindeki placeholder'ı bul
            if (templateLine.includes('(___INPUT___)')) {
              const beforeMatch = templateLine.substring(0, templateLine.indexOf('___INPUT___'));
              const afterMatch = templateLine.substring(templateLine.indexOf('___INPUT___') + '___INPUT___'.length);
              
              return (
                <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography component="span" variant="body2">
                    {beforeMatch}
                  </Typography>
                  <TextField
                    size="small"
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.label}
                    sx={{
                      minWidth: 120,
                      '& .MuiOutlinedInput-root': {
                        height: '28px',
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                  <Typography component="span" variant="body2">
                    {afterMatch}
                  </Typography>
                  {field.required && (
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
            } else {
              // Doğrudan placeholder kullanımı
              const beforeMatch = templateLine.substring(0, templateLine.indexOf('___INPUT___'));
              const afterMatch = templateLine.substring(templateLine.indexOf('___INPUT___') + '___INPUT___'.length);
              
              return (
                <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography component="span" variant="body2">
                    {beforeMatch}
                  </Typography>
                  <TextField
                    size="small"
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.label}
                    sx={{
                      minWidth: 120,
                      '& .MuiOutlinedInput-root': {
                        height: '28px',
                        fontSize: '0.8rem',
                      },
                    }}
                  />
                  <Typography component="span" variant="body2">
                    {afterMatch}
                  </Typography>
                  {field.required && (
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
          <Payment sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Ödeme Mailleri
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

export default OdemeMailleri;
