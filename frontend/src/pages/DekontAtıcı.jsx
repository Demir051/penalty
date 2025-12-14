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
  List,
  ListItem,
  IconButton,
  Alert,
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

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<FolderOpen />}
          onClick={() => fileInputRef.current?.click()}
          size="small"
        >
          PDF Seç
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
          size="small"
        >
          Manuel Ekle
        </Button>
        {pdfFiles.length > 0 && (
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={handleGenerateAll}
            size="small"
            sx={{ ml: 'auto' }}
          >
            Tümünü Kopyala
          </Button>
        )}
      </Box>

      {pdfFiles.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Henüz dosya eklenmedi
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <List dense>
            {pdfFiles.map((file, index) => (
              <ListItem
                key={index}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'background.paper',
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    color="error"
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                }
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {file.fullName}
                  </Typography>
                  <FormControl size="small" fullWidth sx={{ mt: 1, mb: 1 }}>
                    <Select
                      value={file.status}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="default">Durum seçin</MenuItem>
                      <MenuItem value="sent">Dekont iletildi</MenuItem>
                      <MenuItem value="unreachable">Ulaşılamadı</MenuItem>
                      <MenuItem value="already_informed">Zaten bilgi verilmiş</MenuItem>
                    </Select>
                  </FormControl>
                  {file.message && (
                    <Box>
                      <TextField
                        fullWidth
                        size="small"
                        value={file.message}
                        InputProps={{
                          readOnly: true,
                        }}
                        sx={{ mb: 0.5 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleCopyMessage(file.message)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Kopyala
                      </Button>
                    </Box>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default DekontAtıcı;
