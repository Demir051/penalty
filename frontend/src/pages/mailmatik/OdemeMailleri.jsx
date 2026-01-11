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
import { Payment, ContentCopy, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const OdemeMailleri = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({});
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const templates = [
    {
      name: 'Ceza Ödemesi (Tarafımızca) - Sürücü',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'plaka', label: 'Plaka', required: true },
        { key: 'surucuAdi', label: 'Sürücü Adı', required: true },
      ],
      generate: (data) => {
        const surucuAdi = data.surucuAdi || '';
        return `Ceza Ödemesi (${data.cezaNo || ''}) - Sürücü

Merhaba,

Ekte makbuzunu ilettiğim ${data.plaka || ''} plakalı aracın sürücüsü ${surucuAdi}${surucuAdi ? "'in" : ''} ceza ödemesinin gerçekleştirilmesini rica ederim.

Teşekkürler,`;
      }
    },
    {
      name: 'Ceza Ödemesi (Havale) - Sürücü',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'surucuAdi', label: 'Sürücü Adı', required: true },
        { key: 'iban', label: 'İBAN', required: true },
        { key: 'isimSoyisim', label: 'İsim Soyisim', required: true },
      ],
      generate: (data) => `Ceza Ödemesi (${data.cezaNo || ''}) - Sürücü

Merhaba,

Ekte makbuz ve dekontunu ilettiğim sürücü ${data.surucuAdi || ''} ödemesini kendisi gerçekleştirmiştir. Aşağıda ilettiğim banka bilgileri aracılığı ile ödenen cezanın iadesinin yapılmasını rica ederim.

Teşekkürler,

İBAN: ${data.iban || ''}
İsim Soyisim: ${data.isimSoyisim || ''}`
    },
    {
      name: 'Ceza Ödemesi - Yolcu (Tarafımızca)',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'plaka', label: 'Plaka', required: true },
        { key: 'yolcuAdi', label: 'Yolcu Adı', required: true },
      ],
      generate: (data) => {
        const yolcuAdi = data.yolcuAdi || '';
        return `Ceza Ödemesi (${data.cezaNo || ''}) - Yolcu

Merhaba, 

Ekte makbuzunu ilettiğim ${data.plaka || ''} plakalı aracın yolcusu ${yolcuAdi}${yolcuAdi ? "'in" : ''} ceza ödemesinin gerçekleştirilmesini rica ederim. 

Teşekkürler,`;
      }
    },
    {
      name: 'Ceza Ödemesi - Yolcu (Kendi Ödedi)',
      fields: [
        { key: 'cezaNo', label: 'Ceza no', required: true },
        { key: 'yolcuAdi', label: 'Yolcu Adı', required: true },
        { key: 'iban', label: 'İBAN', required: true },
        { key: 'isimSoyisim', label: 'İsim Soyisim', required: true },
      ],
      generate: (data) => `Ceza Ödemesi (${data.cezaNo || ''}) - Yolcu

Merhaba,

Ekte makbuz ve dekontunu ilettiğim yolcu ${data.yolcuAdi || ''} ceza ödemesini kendisi gerçekleştirmiştir. Aşağıda ilettiğim banka bilgileri aracılığı ile ceza ödemesinin yapılmasını rica ederim.

Teşekkürler,

İBAN: ${data.iban || ''}
İsim Soyisim: ${data.isimSoyisim || ''}`
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

İBAN: ${data.iban || ''}`
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

İBAN: ${data.iban || ''}`
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
    const processedLines = new Set(); // İşlenmiş satırları takip et
    
    return lines.map((line, lineIdx) => {
      // Boş satır
      if (!line.trim()) {
        return (
          <Typography key={lineIdx} variant="body2" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {'\u00A0'}
          </Typography>
        );
      }
      
      // Her satır sadece bir kez işlenmeli
      if (processedLines.has(lineIdx)) {
        return null;
      }
      
      // 1. Önce label pattern'leri kontrol et (Ceza no:, Plaka:, İBAN: gibi)
      const labelField = currentTemplate.fields.find(f => {
        const fieldPattern = new RegExp(`${f.label}:\\s*`, 'i');
        return fieldPattern.test(line);
      });

      if (labelField) {
        processedLines.add(lineIdx);
        const parts = line.split(new RegExp(`(${labelField.label}:\\s*)`, 'i'));
        if (parts.length >= 3) {
          const labelPart = parts[1];
          const isEmpty = !currentData[labelField.key] || currentData[labelField.key].trim() === '';
          
          return (
            <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
              <Typography component="span" variant="body2" sx={{ minWidth: 'fit-content', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {labelPart}
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

      // 2. Mail içeriğindeki field değerlerini bul ve inline editing yap
      for (const field of currentTemplate.fields) {
        const fieldValue = currentData[field.key] || '';
        const isEmpty = !fieldValue || fieldValue.trim() === '';
        
        // IBAN için özel kontrol - "İBAN: " label'ından sonra
        if (field.key === 'iban' && line.includes('İBAN:')) {
          // Eğer IBAN zaten label pattern ile yakalandıysa atla
          if (labelField && labelField.key === 'iban') {
            continue;
          }
          
          // IBAN label'ından sonraki kısmı bul
          const ibanIndex = line.indexOf('İBAN:');
          const afterIban = line.substring(ibanIndex + 'İBAN:'.length);
          
          // Eğer IBAN değeri satırda yoksa veya boşsa
          if ((isEmpty || !line.includes(fieldValue)) && !processedLines.has(lineIdx)) {
            processedLines.add(lineIdx);
            const beforeIban = line.substring(0, ibanIndex + 'İBAN:'.length);
            
            return (
              <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                <Typography component="span" variant="body2" sx={{ minWidth: 'fit-content', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {beforeIban}
                </Typography>
                <TextField
                  size="small"
                  value={fieldValue}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.label}
                  sx={{
                    flex: 1,
                    minWidth: { xs: 150, sm: 180 },
                    '& .MuiOutlinedInput-root': {
                      height: '28px',
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
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
        
        // Parantez içindeki değerler: "Ceza Ödemesi (xxx)"
        if (line.includes('(') && line.includes(')')) {
          const parenthesisRegex = /\(([^)]*)\)/g;
          let match;
          const matches = [];
          while ((match = parenthesisRegex.exec(line)) !== null) {
            matches.push({ full: match[0], inner: match[1], index: match.index });
          }
          
          for (const match of matches) {
            // Parantez içeriği field value'suna eşitse
            if (fieldValue && match.inner === fieldValue && !processedLines.has(lineIdx)) {
              processedLines.add(lineIdx);
              const beforeMatch = line.substring(0, match.index);
              const afterMatch = line.substring(match.index + match.full.length);
              
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
            
            // Parantez içi boşsa ve field boşsa
            if (isEmpty && match.inner.trim() === '' && (field.key === 'cezaNo' || field.key === 'plaka') && !processedLines.has(lineIdx)) {
              processedLines.add(lineIdx);
              const beforeMatch = line.substring(0, match.index);
              const afterMatch = line.substring(match.index + match.full.length);
              
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
                        '& input::placeholder': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706',
                          opacity: 0.8,
                        },
                      },
                    }}
                  />
                  <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    ){afterMatch}
                  </Typography>
                  {field.required && (
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
        }
        
        // Doğrudan değişken kullanımı: "plakalı aracın sürücüsü xxx" veya "yolcusu xxx'in" veya "sürücü xxx ödemesini"
        if (fieldValue && line.includes(fieldValue) && !processedLines.has(lineIdx)) {
          // Label pattern ile yakalanmışsa atla
          if (labelField && labelField.key === field.key) {
            continue;
          }
          
          const valueIndex = line.indexOf(fieldValue);
          if (valueIndex !== -1) {
            const beforeValue = line.substring(0, valueIndex);
            const afterValue = line.substring(valueIndex + fieldValue.length);
            
            // Eğer bu değer label pattern'inin parçası değilse
            if (!beforeValue.match(/:\s*$/)) {
              processedLines.add(lineIdx);
              return (
                <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                  <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                    {beforeValue}
                  </Typography>
                  <TextField
                    size="small"
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.label}
                    sx={{
                      minWidth: { xs: 100, sm: 120 },
                      flex: (field.key === 'surucuAdi' || field.key === 'yolcuAdi') ? '0 0 auto' : 1,
                      '& .MuiOutlinedInput-root': {
                        height: '28px',
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      },
                    }}
                  />
                  <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                    {afterValue}
                  </Typography>
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
        }
        
        // Boş field için placeholder gösterimi
        if (isEmpty && !processedLines.has(lineIdx)) {
          // Plaka için "plakalı" kelimesinden önce
          if (field.key === 'plaka' && line.includes('plakalı')) {
            const plakaliIndex = line.indexOf('plakalı');
            if (plakaliIndex > 0) {
              processedLines.add(lineIdx);
              const beforePlaka = line.substring(0, plakaliIndex).trim();
              const afterPlaka = line.substring(plakaliIndex);
              
              // "makbuzunu ilettiğim" veya benzeri bir pattern varsa
              const makbuzIndex = beforePlaka.lastIndexOf('makbuzunu ilettiğim');
              const beforeMakbuz = makbuzIndex !== -1 ? beforePlaka.substring(0, makbuzIndex + 'makbuzunu ilettiğim'.length) + ' ' : '';
              const afterMakbuz = makbuzIndex !== -1 ? beforePlaka.substring(makbuzIndex + 'makbuzunu ilettiğim'.length).trim() : beforePlaka;
              
              return (
                <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                  <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                    {beforeMakbuz}{afterMakbuz ? afterMakbuz + ' ' : ''}
                  </Typography>
                  <TextField
                    size="small"
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    placeholder={field.label}
                    sx={{
                      minWidth: { xs: 100, sm: 120 },
                      flex: '0 0 auto',
                      '& .MuiOutlinedInput-root': {
                        height: '28px',
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        '& input::placeholder': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706',
                          opacity: 0.8,
                        },
                      },
                    }}
                  />
                  <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                    {' ' + afterPlaka}
                  </Typography>
                  {field.required && (
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
          
          // Sürücü/Yolcu adı için "sürücü " veya "yolcusu " kelimelerinden sonra
          if (field.key === 'surucuAdi' || field.key === 'yolcuAdi') {
            // "sürücüsü " veya "sürücü " veya "yolcusu " pattern'lerini kontrol et
            let pattern;
            let match;
            if (field.key === 'surucuAdi') {
              // Önce "sürücüsü" kelimesini kontrol et
              if (line.includes('sürücüsü')) {
                pattern = /sürücüsü\s+/i;
                match = line.match(pattern);
              }
              // Eğer "sürücüsü" bulunamazsa "sürücü" kelimesini kontrol et
              if (!match) {
                pattern = /sürücü\s+(?=\S|$)/i;
                match = line.match(pattern);
              }
            } else {
              pattern = /yolcusu\s+(?=\S|$)/i;
              match = line.match(pattern);
            }
            
            if (match) {
              processedLines.add(lineIdx);
              const matchIndex = line.indexOf(match[0]);
              const beforeMatch = line.substring(0, matchIndex + match[0].length);
              const afterMatch = line.substring(matchIndex + match[0].length);
            
              // "'in ceza" veya "'in" pattern'ini kontrol et
              const possessivePattern = /'in(\s+ceza|)/i;
              const possessiveMatch = afterMatch.match(possessivePattern);
              
              if (possessiveMatch) {
                const beforePossessive = afterMatch.substring(0, afterMatch.indexOf(possessiveMatch[0]));
                const afterPossessive = afterMatch.substring(afterMatch.indexOf(possessiveMatch[0]) + possessiveMatch[0].length);
                
                return (
                  <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                      {beforeMatch}
                    </Typography>
                    <TextField
                      size="small"
                      value={fieldValue}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.label}
                      sx={{
                        minWidth: { xs: 100, sm: 120 },
                        flex: '0 0 auto',
                        '& .MuiOutlinedInput-root': {
                          height: '28px',
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          '& input::placeholder': {
                            color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706',
                            opacity: 0.8,
                          },
                        },
                      }}
                    />
                    <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                      {beforePossessive}{possessiveMatch[0]}{afterPossessive}
                    </Typography>
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
              } else {
                // Possessive pattern yoksa normal şekilde göster
                return (
                  <Box key={lineIdx} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                      {beforeMatch}
                    </Typography>
                    <TextField
                      size="small"
                      value={fieldValue}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.label}
                      sx={{
                        minWidth: { xs: 100, sm: 120 },
                        flex: '0 0 auto',
                        '& .MuiOutlinedInput-root': {
                          height: '28px',
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          '& input::placeholder': {
                            color: (theme) => theme.palette.mode === 'dark' ? '#ff9800' : '#d97706',
                            opacity: 0.8,
                          },
                        },
                      }}
                    />
                    <Typography component="span" variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, wordBreak: 'break-word' }}>
                      {afterMatch}
                    </Typography>
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
          <Payment sx={{ fontSize: { xs: 24, sm: 32 }, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Ödeme Mailleri
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
            <Box sx={{ fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.8 }}>
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

export default OdemeMailleri;
