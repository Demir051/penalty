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
  Pagination,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Description } from '@mui/icons-material';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState(0);
  const [mailBeyanStats, setMailBeyanStats] = useState({
    mailLogs: [],
    beyanLogs: [],
    mailStats: {},
    beyanStats: {},
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const logsPerPage = 20;
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/logs?limit=300');
      setLogs(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Loglar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const fetchMailBeyanStats = async () => {
    try {
      setStatsLoading(true);
      const res = await axios.get('/api/logs/mail-beyan-stats');
      setMailBeyanStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'İstatistikler alınamadı');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchLogs();
    fetchMailBeyanStats();
  }, [user, navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, position: 'relative' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">İşlem Logları</Typography>
          <Chip label={`Toplam ${logs.length}`} size="small" />
        </Stack>
        
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Tüm Loglar" />
          <Tab label="Mail & Beyan İstatistikleri" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {tab === 0 && (
          <>
            {loading && (
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <CircularProgress size={32} />
              </Box>
            )}
            <Stack spacing={2}>
              {logs
                .slice((page - 1) * logsPerPage, page * logsPerPage)
                .map((log) => (
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
            {logs.length > logsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil(logs.length / logsPerPage)}
                  page={page}
                  onChange={(e, newPage) => setPage(newPage)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            {statsLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}
            {!statsLoading && (
              <Stack spacing={3}>
                {/* Mail İstatistikleri */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Mail sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">Mail İstatistikleri</Typography>
                  </Box>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {Object.entries(mailBeyanStats.mailStats).map(([userName, stats]) => (
                      <Grid item xs={12} sm={6} md={4} key={userName}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                              {userName}
                            </Typography>
                            <Typography variant="h4" color="primary.main" sx={{ mb: 1 }}>
                              {stats.total}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Toplam Mail
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Stack spacing={0.5}>
                              {Object.entries(stats.byType).map(([type, count]) => (
                                <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption">{type}</Typography>
                                  <Typography variant="caption" fontWeight="600">{count}</Typography>
                                </Box>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Kullanıcı</TableCell>
                          <TableCell>Mail Tipi</TableCell>
                          <TableCell>Tarih</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mailBeyanStats.mailLogs.slice(0, 50).map((log) => (
                          <TableRow key={log._id}>
                            <TableCell>{log.actorName}</TableCell>
                            <TableCell>{log.metadata?.mailType || 'Bilinmiyor'}</TableCell>
                            <TableCell>{dayjs(log.createdAt).format('DD.MM.YYYY HH:mm')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* Beyan İstatistikleri */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Description sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">Beyan İstatistikleri</Typography>
                  </Box>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {Object.entries(mailBeyanStats.beyanStats).map(([userName, stats]) => (
                      <Grid item xs={12} sm={6} md={4} key={userName}>
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                              {userName}
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                              {stats.total}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Toplam Beyan
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Kullanıcı</TableCell>
                          <TableCell>Tarih</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mailBeyanStats.beyanLogs.slice(0, 50).map((log) => (
                          <TableRow key={log._id}>
                            <TableCell>{log.actorName}</TableCell>
                            <TableCell>{dayjs(log.createdAt).format('DD.MM.YYYY HH:mm')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Stack>
            )}
          </>
        )}

        <Divider sx={{ mt: 2 }} />
        <Typography variant="caption" color="text.secondary">Sadece adminler görüntüleyebilir.</Typography>
      </Paper>
    </Container>
  );
};

export default AdminLogs;

