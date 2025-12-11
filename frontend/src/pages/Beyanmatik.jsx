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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save, Send } from '@mui/icons-material';

const Beyanmatik = () => {
  // Form state
  const [formData, setFormData] = useState({
    // Sol sütun
    beyaniAlan: 'Ahmet Demir Altınöz',
    cezaNo: '',
    saibeliMi: '',
    yolcuId: '',
    yolcuIsmi: '',
    yolcuTelNo: '',
    yolcuYolS: '',
    // Orta sütun
    surucuId: '',
    surucuIsmi: '',
    surucuTelNo: '',
    surucuKayitT: '',
    aracMMR: '',
    aracPlakasi: '',
    surucuYolS: '',
    // Sağ sütun
    hangiAndaCeza: '',
    polisMemuru: '',
    erkenUyariyaDustuMu: '',
    surucuyeBilgiVerildiMi: '',
    kacinciCezasi: '',
    yolculukId: '',
    eslesmeId: '',
  });

  // Sorular ve cevaplar state
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

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
    },
    {
      id: 2,
      question: 'Sürüşünüz başlamış mıydı? Yolcudan kodu almış mıydınız?',
      type: 'select',
      options: ['Evet, başlamıştı ve kodu almıştım', 'Hayır, başlamamıştı', 'Kodu almamıştım'],
    },
    {
      id: 3,
      question: 'Olay tarihi nedir?',
      type: 'date',
    },
    {
      id: 4,
      question: 'Olay ne zaman oldu? Tam olarak saat kaçtı?',
      type: 'time',
    },
    {
      id: 5,
      question: 'Olay yeri neresiydi?',
      type: 'select',
      options: ['Şehir içi', 'Şehir dışı', 'Otoyol', 'Diğer'],
    },
    {
      id: 6,
      question: 'Buluşma noktanız neresiydi?',
      type: 'text',
    },
    {
      id: 7,
      question: 'Nereye gidecektiniz?',
      type: 'text',
    },
    {
      id: 8,
      question: 'Yolculuk başladıktan kaç dakika sonra çevirme gerçekleşti? Yolculuk başlamış mıydı?',
      type: 'select',
      options: ['0-5 dakika, başlamıştı', '5-10 dakika, başlamıştı', '10+ dakika, başlamıştı', 'Başlamamıştı'],
    },
    {
      id: 9,
      question: 'Yolda çevirme uygulaması mı var yoksa mobil ekip miydi?',
      type: 'select',
      options: ['Yolda çevirme uygulaması', 'Mobil ekip', 'Bilmiyorum'],
    },
    {
      id: 10,
      question: 'Sivil ekip miydi yoksa üniformalı trafik polisi miydi?',
      type: 'select',
      options: ['Sivil ekip', 'Üniformalı trafik polisi', 'Her ikisi de', 'Bilmiyorum'],
    },
    {
      id: 11,
      question: 'Yolcu araçta hangi koltukta oturuyordu?',
      type: 'select',
      options: ['Ön koltuk (sağ)', 'Arka koltuk (sağ)', 'Arka koltuk (sol)', 'Arka koltuk (orta)'],
    },
    {
      id: 12,
      question: 'Ceza yazan polise TAG sürüşü olduğunu söylediniz mi?',
      type: 'select',
      options: ['Evet', 'Hayır'],
    },
    {
      id: 13,
      question: 'TAG olduğunu söylediğinizde/düşündüklerinde memurun cevabı tavrı nasıldı?',
      type: 'select',
      options: ['Olumlu', 'Olumsuz', 'Kayıtsız', 'Bilmiyorum'],
    },
    {
      id: 14,
      question: 'Size davranışları nasıldı? Olay sırasında nasıl bir sorgu oldu?',
      type: 'select',
      options: ['Nazik', 'Normal', 'Sert', 'Çok sert'],
    },
    {
      id: 15,
      question: 'Aracınız hangi otoparka çekildi?',
      type: 'text',
    },
    {
      id: 16,
      question: 'Aracınızın gözle görülmeyen yerlerinde arama yapıldı mı?',
      type: 'select',
      options: ['Evet', 'Hayır', 'Bilmiyorum'],
    },
    {
      id: 17,
      question: 'Ceza tutanağına imza attınız mı?',
      type: 'select',
      options: ['Evet', 'Hayır'],
    },
    {
      id: 18,
      question: 'Olayla ilgili bir video veya ses kaydı aldınız mı?',
      type: 'select',
      options: ['Evet, video', 'Evet, ses', 'Evet, her ikisi de', 'Hayır'],
    },
    {
      id: 19,
      question: 'Yolcuyu ve sizi ayırarak ayrı ayrı çapraz sorgu yaptılar mı?',
      type: 'select',
      options: ['Evet', 'Hayır'],
    },
    {
      id: 20,
      question: 'Sorgu esnasında araçtan indirildiniz mi?',
      type: 'select',
      options: ['Evet', 'Hayır'],
    },
    {
      id: 21,
      question: 'Memurlar martı sürüşü olduğunu nereden anladı?',
      type: 'select',
      options: ['Benden öğrendiler', 'Yolcudan öğrendiler', 'Uygulamadan gördüler', 'Bilmiyorum'],
    },
    {
      id: 22,
      question: 'Telefonunuza bakmak istediler mi? Evet ise; Baktılar mı?',
      type: 'select',
      options: ['Evet, istediler ve baktılar', 'Evet, istediler ama bakmadılar', 'Hayır, istemediler'],
    },
    {
      id: 23,
      question: 'Çapraz sorgu yaptılar mı? Hayır ise; Sorguda baskı yaptılar mı?',
      type: 'select',
      options: ['Evet, çapraz sorgu yaptılar', 'Hayır, çapraz sorgu yapmadılar ama baskı yaptılar', 'Hayır, ne çapraz sorgu ne baskı'],
    },
    {
      id: 24,
      question: 'Zorla tutanak imzalattılar mı?',
      type: 'select',
      options: ['Evet', 'Hayır'],
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

      {/* Ana Form Alanları */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CircularProgress size={32} />
          </Box>
        )}
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Beyan Bilgileri
        </Typography>
        <Grid container spacing={2}>
          {/* Sol Sütun */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Beyanı Alan"
              value={formData.beyaniAlan}
              onChange={(e) => handleFormChange('beyaniAlan', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Ceza no"
              value={formData.cezaNo}
              onChange={(e) => handleFormChange('cezaNo', e.target.value)}
              margin="normal"
              size="small"
            />
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Şaibeli mi?</InputLabel>
              <Select
                value={formData.saibeliMi}
                onChange={(e) => handleFormChange('saibeliMi', e.target.value)}
                label="Şaibeli mi?"
              >
                <MenuItem value="evet">Evet</MenuItem>
                <MenuItem value="hayir">Hayır</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Yolcu ID"
              value={formData.yolcuId}
              onChange={(e) => handleFormChange('yolcuId', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Yolcu ismi"
              value={formData.yolcuIsmi}
              onChange={(e) => handleFormChange('yolcuIsmi', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Yolcu tel no"
              value={formData.yolcuTelNo}
              onChange={(e) => handleFormChange('yolcuTelNo', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Yolcu Yol. S."
              value={formData.yolcuYolS}
              onChange={(e) => handleFormChange('yolcuYolS', e.target.value)}
              margin="normal"
              size="small"
            />
          </Grid>

          {/* Orta Sütun */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Sürücü ID"
              value={formData.surucuId}
              onChange={(e) => handleFormChange('surucuId', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Sürücü ismi"
              value={formData.surucuIsmi}
              onChange={(e) => handleFormChange('surucuIsmi', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Sürücü tel no"
              value={formData.surucuTelNo}
              onChange={(e) => handleFormChange('surucuTelNo', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Sürücü kayıt t."
              type="date"
              value={formData.surucuKayitT}
              onChange={(e) => handleFormChange('surucuKayitT', e.target.value)}
              margin="normal"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Araç M/M/R"
              value={formData.aracMMR}
              onChange={(e) => handleFormChange('aracMMR', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Araç Plakası"
              value={formData.aracPlakasi}
              onChange={(e) => handleFormChange('aracPlakasi', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Sürücü Yol. S."
              value={formData.surucuYolS}
              onChange={(e) => handleFormChange('surucuYolS', e.target.value)}
              margin="normal"
              size="small"
            />
          </Grid>

          {/* Sağ Sütun */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Hangi anda ceza kesildi?"
              value={formData.hangiAndaCeza}
              onChange={(e) => handleFormChange('hangiAndaCeza', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Makbuz varsa polis memuru/memurları"
              value={formData.polisMemuru}
              onChange={(e) => handleFormChange('polisMemuru', e.target.value)}
              margin="normal"
              size="small"
            />
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Erken uyarıya düştü mü?</InputLabel>
              <Select
                value={formData.erkenUyariyaDustuMu}
                onChange={(e) => handleFormChange('erkenUyariyaDustuMu', e.target.value)}
                label="Erken uyarıya düştü mü?"
              >
                <MenuItem value="evet">Evet</MenuItem>
                <MenuItem value="hayir">Hayır</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Düştüyse sürücüye bilgi verildi mi?</InputLabel>
              <Select
                value={formData.surucuyeBilgiVerildiMi}
                onChange={(e) => handleFormChange('surucuyeBilgiVerildiMi', e.target.value)}
                label="Düştüyse sürücüye bilgi verildi mi?"
              >
                <MenuItem value="evet">Evet</MenuItem>
                <MenuItem value="hayir">Hayır</MenuItem>
                <MenuItem value="uygulanamaz">Uygulanamaz</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Kaçıncı cezası"
              value={formData.kacinciCezasi}
              onChange={(e) => handleFormChange('kacinciCezasi', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Yolculuk ID"
              value={formData.yolculukId}
              onChange={(e) => handleFormChange('yolculukId', e.target.value)}
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Eşleşme ID"
              value={formData.eslesmeId}
              onChange={(e) => handleFormChange('eslesmeId', e.target.value)}
              margin="normal"
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Sorular ve Cevaplar Bölümü */}
      <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CircularProgress size={32} />
          </Box>
        )}
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Sorular ve Cevaplar
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '50%', fontWeight: 'bold', bgcolor: 'grey.100' }}>
                  SORULAR
                </TableCell>
                <TableCell sx={{ width: '50%', fontWeight: 'bold', bgcolor: 'grey.100' }}>
                  CEVAPLAR
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell sx={{ verticalAlign: 'top', py: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {question.id}. {question.question}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>{renderAnswerField(question)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Kaydet ve Gönder Butonları */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="outlined" startIcon={<Save />} onClick={handleSubmit}>
            Kaydet
          </Button>
          <Button variant="contained" startIcon={<Send />} onClick={handleSubmit}>
            Gönder
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Beyanmatik;
