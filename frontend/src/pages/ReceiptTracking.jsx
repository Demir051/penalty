import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  useMediaQuery,
  useTheme,
  Checkbox,
  FormControlLabel,
  Pagination,
} from '@mui/material';
import { Add, Edit, Delete, Receipt } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const ReceiptTracking = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    penaltyDate: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    type: 'sürücü',
  });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const receiptsPerPage = 20;
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/receipts');
      setReceipts(res.data);
      setError('');
    } catch (err) {
      setError('Makbuzlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (receipt = null) => {
    if (receipt) {
      setEditingId(receipt._id);
      setFormData({
        penaltyDate: receipt.penaltyDate ? dayjs(receipt.penaltyDate).format('DD.MM.YYYY') : '',
        fullName: receipt.fullName || '',
        phoneNumber: receipt.phoneNumber || '',
        email: receipt.email || '',
        type: receipt.type || 'sürücü',
      });
    } else {
      setEditingId(null);
      setFormData({
        penaltyDate: '',
        fullName: '',
        phoneNumber: '',
        email: '',
        type: 'sürücü',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (!submitting) {
      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        penaltyDate: '',
        fullName: '',
        phoneNumber: '',
        email: '',
        type: 'sürücü',
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.penaltyDate) {
      setError('Ceza tarihi gereklidir');
      return;
    }
    if (!formData.fullName.trim()) {
      setError('İsim soyisim gereklidir');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Telefon numarası gereklidir');
      return;
    }
    if (!formData.email.trim()) {
      setError('Mail adresi gereklidir');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Convert date format from DD.MM.YYYY to YYYY-MM-DD for backend
      let submitData = { ...formData };
      if (submitData.penaltyDate) {
        const dateParts = submitData.penaltyDate.split('.');
        if (dateParts.length === 3) {
          submitData.penaltyDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        }
      }

      if (editingId) {
        await axios.patch(`/api/receipts/${editingId}`, submitData);
        setSuccess('Makbuz güncellendi');
      } else {
        await axios.post('/api/receipts', submitData);
        setSuccess('Makbuz eklendi');
      }

      await fetchReceipts();
      handleCloseDialog();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Makbuz kaydedilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessedChange = async (receiptId, isProcessed) => {
    try {
      await axios.patch(`/api/receipts/${receiptId}`, { isProcessed });
      await fetchReceipts();
    } catch (err) {
      setError(err.response?.data?.message || 'Makbuz durumu güncellenemedi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu makbuzu silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/api/receipts/${id}`);
      setSuccess('Makbuz silindi');
      await fetchReceipts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Makbuz silinemedi');
    }
  };

  // Calculate early payment days for display
  // Formula: today - penaltyDate (days difference)
  const getEarlyPaymentDays = (penaltyDate) => {
    if (!penaltyDate) return 0;
    const today = dayjs().startOf('day');
    const penalty = dayjs(penaltyDate).startOf('day');
    const diffDays = today.diff(penalty, 'day');
    return diffDays > 0 ? diffDays : 0;
  };

  // Check if user has access
  if (!user || (user.role !== 'admin' && user.role !== 'ceza')) {
    return (
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Makbuz Takip
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: '12px' }}
          >
            Makbuz Ekle
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            sx={{
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              maxHeight: { xs: '60vh', sm: '70vh' },
              overflowX: 'auto',
            }}
          >
            <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Ceza Tarihi
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    İsim Soyisim
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Telefon
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Mail
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Sürücü/Yolcu
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Erken Ödeme (Gün)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    İşlendi mi?
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Henüz makbuz eklenmemiş
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts
                    .slice((page - 1) * receiptsPerPage, page * receiptsPerPage)
                    .map((receipt) => (
                    <TableRow 
                      key={receipt._id} 
                      hover
                      sx={{
                        bgcolor: receipt.isProcessed ? (theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.08)') : 'transparent',
                        '&:hover': {
                          bgcolor: receipt.isProcessed ? (theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.12)') : 'action.hover',
                        },
                      }}
                    >
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {dayjs(receipt.penaltyDate).format('DD.MM.YYYY')}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{receipt.fullName}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{receipt.phoneNumber}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{receipt.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={receipt.type === 'sürücü' ? 'Sürücü' : 'Yolcu'}
                          color={receipt.type === 'sürücü' ? 'primary' : 'secondary'}
                          size="small"
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            bgcolor: receipt.type === 'sürücü' 
                              ? (theme.palette.mode === 'dark' ? 'rgba(66, 165, 245, 0.2)' : 'rgba(25, 118, 210, 0.1)')
                              : (theme.palette.mode === 'dark' ? 'rgba(233, 30, 99, 0.2)' : 'rgba(156, 39, 176, 0.1)')
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const days = receipt.earlyPaymentDays || getEarlyPaymentDays(receipt.penaltyDate);
                          let bgcolor = 'default';
                          if (days <= 15) {
                            bgcolor = theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.15)';
                          } else if (days <= 25) {
                            bgcolor = theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.15)';
                          } else {
                            bgcolor = theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.15)';
                          }
                          return (
                            <Chip
                              label={days}
                              size="small"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                bgcolor: bgcolor,
                                color: theme.palette.mode === 'dark' ? 'inherit' : 'text.primary'
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Checkbox
                            checked={receipt.isProcessed || false}
                            onChange={(e) => handleProcessedChange(receipt._id, e.target.checked)}
                            size="small"
                          />
                          {(user.role === 'admin' || receipt.createdBy?.toString() === user._id) && (
                            <>
                              <Tooltip title="Düzenle">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenDialog(receipt)}
                                  sx={{ p: 0.5 }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Sil">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(receipt._id)}
                                  sx={{ p: 0.5 }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {receipts.length > receiptsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(receipts.length / receiptsPerPage)}
              page={page}
              onChange={(e, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' }, fontWeight: 600 }}>
          {editingId ? 'Makbuz Düzenle' : 'Yeni Makbuz Ekle'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Ceza Tarihi (DD.MM.YYYY)"
              value={formData.penaltyDate}
              onChange={(e) => setFormData({ ...formData, penaltyDate: e.target.value })}
              placeholder="DD.MM.YYYY"
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            <TextField
              fullWidth
              label="İsim Soyisim"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            <TextField
              fullWidth
              label="Telefon Numarası"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            <TextField
              fullWidth
              label="Mail Adresi"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Sürücü/Yolcu</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Sürücü/Yolcu"
                sx={{
                  borderRadius: '8px',
                }}
              >
                <MenuItem value="sürücü">Sürücü</MenuItem>
                <MenuItem value="yolcu">Yolcu</MenuItem>
              </Select>
            </FormControl>
            {formData.penaltyDate && (
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                Erken Ödeme Süresi: {(() => {
                  try {
                    const dateParts = formData.penaltyDate.split('.');
                    if (dateParts.length === 3) {
                      const date = dayjs(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                      return getEarlyPaymentDays(date);
                    }
                  } catch (e) {}
                  return 0;
                })()} gün (otomatik hesaplanacak)
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
          <Button onClick={handleCloseDialog} disabled={submitting} sx={{ borderRadius: '8px' }}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{ borderRadius: '8px' }}
          >
            {submitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReceiptTracking;

