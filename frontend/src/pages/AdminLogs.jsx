import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/logs?limit=300');
      setLogs(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Loglar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchLogs();
  }, [user, navigate]);

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CircularProgress size={32} />
          </Box>
        )}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">İşlem Logları</Typography>
          <Chip label={`Toplam ${logs.length}`} size="small" />
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          {logs.map((log) => (
            <Box key={log._id} sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {log.actorName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(log.createdAt).format('DD.MM.YYYY HH:mm')}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {log.message}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={log.action} size="small" />
                <Chip label={log.targetType} size="small" variant="outlined" />
              </Stack>
            </Box>
          ))}
          {logs.length === 0 && !loading && (
            <Typography variant="body2" color="text.secondary">Log bulunamadı.</Typography>
          )}
        </Stack>
        <Divider sx={{ mt: 2 }} />
        <Typography variant="caption" color="text.secondary">Sadece adminler görüntüleyebilir.</Typography>
      </Paper>
    </Container>
  );
};

export default AdminLogs;

