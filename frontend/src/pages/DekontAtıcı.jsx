import { useState, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  FolderOpen,
  Delete,
  Send,
  Description,
} from '@mui/icons-material';

const DekontAtıcı = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const pdfFilesList = files
      .filter(file => file.name.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        name: file.name.replace('.pdf', ''),
        fullName: file.name,
        status: 'default',
        message: '',
      }));
    
    setPdfFiles(prev => [...prev, ...pdfFilesList]);
    setError('');
  };

  const handleStatusChange = (index, status) => {
    setSelectedStatus(prev => ({ ...prev, [index]: status }));
    const newFiles = [...pdfFiles];
    newFiles[index].status = status;
    
    // Generate message based on status
    const name = newFiles[index].name;
    switch (status) {
      case 'sent':
        newFiles[index].message = `${name} - Dekont iletildi. Destek sağlayacığını belirtti.`;
        break;
      case 'unreachable':
        newFiles[index].message = `${name} - Ulaşılamadı`;
        break;
      case 'already_informed':
        newFiles[index].message = `${name} - Zaten bilgi verilmiş`;
        break;
      default:
        newFiles[index].message = '';
    }
    
    setPdfFiles(newFiles);
  };

  const handleRemoveFile = (index) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
    const newStatus = { ...selectedStatus };
    delete newStatus[index];
    setSelectedStatus(newStatus);
  };

  const handleAddManual = () => {
    const name = prompt('PDF dosya adını girin (uzantı olmadan):');
    if (name && name.trim()) {
      setPdfFiles(prev => [...prev, {
        name: name.trim(),
        fullName: `${name.trim()}.pdf`,
        status: 'default',
        message: '',
      }]);
    }
  };

  const handleGenerateAll = () => {
    const allMessages = pdfFiles
      .filter(file => file.message)
      .map(file => file.message)
      .join('\n');
    
    if (allMessages) {
      navigator.clipboard.writeText(allMessages).then(() => {
        alert('Tüm mesajlar panoya kopyalandı!');
      });
    }
  };

  const handleCopyMessage = (message) => {
    navigator.clipboard.writeText(message).then(() => {
      alert('Mesaj panoya kopyalandı!');
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dekont Atıcı
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        PDF dosyalarını seçin veya manuel ekleyin, her biri için durum seçin ve mesajları oluşturun.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* File Selection */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Dosya Seçimi
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<FolderOpen />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
              >
                PDF Dosyaları Seç
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<Description />}
                onClick={handleAddManual}
                fullWidth
              >
                Manuel Ekle
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* PDF List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                PDF Dosyaları ({pdfFiles.length})
              </Typography>
              {pdfFiles.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleGenerateAll}
                  size="small"
                >
                  Tümünü Kopyala
                </Button>
              )}
            </Box>

            {pdfFiles.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Henüz dosya eklenmedi
                </Typography>
              </Box>
            ) : (
              <List>
                {pdfFiles.map((file, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {file.fullName}
                          </Typography>
                          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                            <InputLabel>Durum Seçin</InputLabel>
                            <Select
                              value={file.status}
                              onChange={(e) => handleStatusChange(index, e.target.value)}
                              label="Durum Seçin"
                            >
                              <MenuItem value="default">Seçiniz</MenuItem>
                              <MenuItem value="sent">Dekont iletildi</MenuItem>
                              <MenuItem value="unreachable">Ulaşılamadı</MenuItem>
                              <MenuItem value="already_informed">Zaten bilgi verilmiş</MenuItem>
                            </Select>
                          </FormControl>
                          {file.message && (
                            <Box>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                value={file.message}
                                label="Oluşturulan Mesaj"
                                InputProps={{
                                  readOnly: true,
                                }}
                                sx={{ mb: 1 }}
                              />
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleCopyMessage(file.message)}
                              >
                                Mesajı Kopyala
                              </Button>
                            </Box>
                          )}
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveFile(index)}
                          sx={{ ml: 1 }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DekontAtıcı;
