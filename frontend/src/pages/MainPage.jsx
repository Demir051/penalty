import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  LinearProgress,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Pagination,
  Fab,
} from '@mui/material';
import {
  People,
  Assignment,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Gavel,
  Assessment,
  Edit,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MainPage = () => {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    todayPenalties: 0,
    weeklyTotal: 0,
    weeklyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [penaltyDialog, setPenaltyDialog] = useState(false);
  const [penaltyInput, setPenaltyInput] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const membersPerPage = 4;
  const { user } = useAuth();

  // Memoize computed values to prevent unnecessary recalculations
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const criticalTasks = useMemo(() => tasks.filter((t) => !t.completed && t.priority === 'critical'), [tasks]);
  const activeMembers = useMemo(() => members.filter((m) => m.isCurrentlyActive).length, [members]);
  
  // Sort members: active first, then by role (admin > ceza > uye), then alphabetically
  const sortedMembers = useMemo(() => {
    const roleOrder = { admin: 0, ceza: 1, uye: 2 };
    
    return [...members].sort((a, b) => {
      // First: Active members first
      if (a.isCurrentlyActive && !b.isCurrentlyActive) return -1;
      if (!a.isCurrentlyActive && b.isCurrentlyActive) return 1;
      
      // Second: Sort by role (admin > ceza > uye)
      const roleA = roleOrder[a.role] ?? 3;
      const roleB = roleOrder[b.role] ?? 3;
      if (roleA !== roleB) return roleA - roleB;
      
      // Third: If same status and role, sort alphabetically by name
      return (a.fullName || a.username || '').localeCompare(b.fullName || b.username || '');
    });
  }, [members]);

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Kullanıcıları getir
      try {
        const resUsers = await axios.get('/api/users');
        setMembers(resUsers.data || []);
      } catch (err) {
        setMembers([]);
      }

      // Bugünkü ceza
      try {
        const todayPenalty = await axios.get('/api/penalties/today');
        setStats(prev => ({
          ...prev,
          todayPenalties: todayPenalty.data.count || 0,
        }));
      } catch (err) {
        // Silently fail for optional data
        if (import.meta.env.DEV) {
          console.error('Error fetching today penalty:', err);
        }
      }

      // Haftalık toplam
      try {
        const weeklyTotal = await axios.get('/api/penalties/weekly-total');
        setStats(prev => ({
          ...prev,
          weeklyTotal: weeklyTotal.data.total || 0,
        }));
      } catch (err) {
        // Silently fail for optional data
        if (import.meta.env.DEV) {
          console.error('Error fetching weekly total:', err);
        }
      }

      // Haftalık grafik verilerini getir
      try {
        const weeklyResponse = await axios.get('/api/penalties/weekly');
        setStats(prev => ({
          ...prev,
          weeklyData: weeklyResponse.data.weeklyData || [],
        }));
      } catch (err) {
        // Silently fail for optional data
        if (import.meta.env.DEV) {
          console.error('Error fetching weekly data:', err);
        }
      }

      // Görevleri getir (only if user has access)
      if (user?.role !== 'uye') {
        try {
          setBusy(true);
          const response = await axios.get('/api/tasks');
          setTasks(response.data || []);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Error fetching tasks:', err);
          }
        } finally {
          setBusy(false);
        }
      }

      setError('');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error fetching dashboard data:', err);
      }
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleUpdatePenalty = async () => {
    const count = parseInt(penaltyInput);
    if (isNaN(count) || count < 0) {
      setError('Geçerli bir sayı girin');
      return;
    }
    try {
      await axios.post('/api/penalties/today', { count });
      setPenaltyDialog(false);
      setPenaltyInput('');
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Ceza güncellenemedi');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'medium':
        return 'warning';
      case 'normal':
        return 'info';
      default:
        return 'default';
    }
  };

  if ((loading && members.length === 0) || busy) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Günlük özet ve istatistikler
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* İstatistik Kartları */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.todayPenalties}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Bugünkü Ceza
                  </Typography>
                </Box>
                <Gavel sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {activeMembers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Aktif Üye
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {pendingTasks.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Bekleyen Görev
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.weeklyTotal}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Bu Hafta Toplam
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Çizgi Grafik - Haftalık Ceza Trendi */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Haftalık Ceza Trendi
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={stats.weeklyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis 
                  domain={[0, 60]}
                  ticks={[0, 10, 20, 30, 40, 50, 60]}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ceza"
                  stroke="#1976d2"
                  strokeWidth={3}
                  dot={{ fill: '#1976d2', r: 5 }}
                  activeDot={{ r: 8 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Pasta Grafik - Ceza Dağılımı */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Assessment sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Görev & Ceza Dağılımı
              </Typography>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Bekleyen Görevler', value: pendingTasks.length, color: '#ef4444' },
                    { name: 'Biten Görevler', value: completedTasks.length, color: '#22c55e' },
                    { name: 'Bugünkü Ceza', value: stats.todayPenalties, color: '#8884d8' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {[
                    { color: '#ef4444' },
                    { color: '#22c55e' },
                    { color: '#8884d8' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Kayıtlı Üyeler */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Kayıtlı Üyeler
              </Typography>
            </Box>
            <List>
              {sortedMembers
                .slice((memberPage - 1) * membersPerPage, memberPage * membersPerPage)
                .map((member, index) => (
                  <Box key={member._id || member.id || member.username}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={member.profileImage} sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(member.fullName)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.fullName}
                        secondary={
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              component="span"
                              label={member.isCurrentlyActive ? 'Aktif' : 'Pasif'}
                              size="small"
                              color={member.isCurrentlyActive ? 'success' : 'default'}
                            />
                            <Chip
                              component="span"
                              label={member.role === 'admin' ? 'Admin' : member.role === 'ceza' ? 'Ceza' : 'Üye'}
                              size="small"
                              color={member.role === 'admin' ? 'primary' : member.role === 'ceza' ? 'warning' : 'default'}
                            />
                            <Typography component="span" variant="caption" color="text.secondary">
                              {member.email}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(membersPerPage, sortedMembers.length - (memberPage - 1) * membersPerPage) - 1 && <Divider />}
                  </Box>
                ))}
              {sortedMembers.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Kullanıcı listesi alınamadı.
                </Typography>
              )}
            </List>
            {sortedMembers.length > membersPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={Math.ceil(sortedMembers.length / membersPerPage)}
                  page={memberPage}
                  onChange={(e, page) => setMemberPage(page)}
                  size="small"
                  color="primary"
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Önemli Görevler - Sadece admin ve ceza rolü görebilir */}
        {(user?.role === 'admin' || user?.role === 'ceza') && (
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Önemli Görevler (Kritik)
                </Typography>
              </Box>
              <List>
                {criticalTasks.map((task, index) => (
                  <Box key={task._id}>
                    <ListItem
                      sx={{
                        bgcolor: task.completed ? 'action.hover' : 'transparent',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemAvatar>
                        {task.completed ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Schedule color="action" />
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                textDecoration: task.completed ? 'line-through' : 'none',
                                opacity: task.completed ? 0.6 : 1,
                              }}
                            >
                              {task.content}
                            </Typography>
                            <Chip
                              label="Kritik"
                              size="small"
                              color="error"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < criticalTasks.length - 1 && <Divider />}
                  </Box>
                ))}
                {criticalTasks.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Kritik öncelikli görev yok.
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Modern Ceza Güncelleme Butonu - Floating Action Button */}
      {(user?.role === 'admin' || user?.role === 'ceza') && (
        <Fab
          color="primary"
          aria-label="edit penalty"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => {
            setPenaltyInput(stats.todayPenalties.toString());
            setPenaltyDialog(true);
          }}
        >
          <Edit />
        </Fab>
      )}

      <Dialog open={penaltyDialog} onClose={() => setPenaltyDialog(false)}>
        <DialogTitle>Bugünkü Ceza Sayısını Güncelle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Ceza Sayısı"
            type="number"
            fullWidth
            variant="outlined"
            value={penaltyInput}
            onChange={(e) => setPenaltyInput(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPenaltyDialog(false)}>İptal</Button>
          <Button onClick={handleUpdatePenalty} variant="contained">Güncelle</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MainPage;
