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
  useMediaQuery,
  useTheme,
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
  OpenInNew,
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
  const [allPenaltiesDialog, setAllPenaltiesDialog] = useState(false);
  const [allPenalties, setAllPenalties] = useState([]);
  const [penaltyDates, setPenaltyDates] = useState({});
  const [memberPage, setMemberPage] = useState(1);
  const membersPerPage = 4;
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Helper function to strip HTML tags and base64 images
  const stripHtmlAndImages = (html) => {
    if (!html || typeof html !== 'string') return '';
    // Remove img tags (including base64 data)
    let text = html.replace(/<img[^>]*>/gi, '');
    // Remove all HTML tags
    text = text.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    const div = document.createElement('div');
    div.innerHTML = text;
    text = div.textContent || div.innerText || '';
    return text.trim();
  };

  // Memoize computed values to prevent unnecessary recalculations
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const criticalTasks = useMemo(() => tasks.filter((t) => !t.completed && t.priority === 'critical'), [tasks]);
  const activeMembers = useMemo(() => members.filter((m) => m.isCurrentlyActive).length, [members]);

  // Bugünkü görevler için pie chart verisi
  const todayTasksPieData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Bugün gelen bekleyen görevler (bugün oluşturulan ve henüz tamamlanmamış)
    const todayPendingTasks = tasks.filter(t => {
      if (t.completed) return false;
      if (!t.createdAt) return false;
      const createdDate = new Date(t.createdAt);
      return createdDate >= today && createdDate <= todayEnd;
    }).length;

    // Bugün biten görevler (bugün tamamlanmış olanlar)
    const todayCompletedTasks = tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= today && completedDate <= todayEnd;
    }).length;

    const pieData = [
      { name: 'Bekleyen Görevler', value: todayPendingTasks, color: '#ef4444' },
      { name: 'Tamamlanan Görevler', value: todayCompletedTasks, color: '#10b981' },
      { name: 'Bugünkü Ceza', value: stats.todayPenalties, color: '#8884d8' },
    ].filter(item => item.value > 0); // Sadece değeri 0'dan büyük olanları göster

    return pieData;
  }, [tasks, stats.todayPenalties]);
  
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
    // Otomatik yenileme kaldırıldı - sadece sayfa yüklendiğinde bir kez çalışır
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

  const fetchAllPenalties = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 4); // 4 ay öncesi
      
      const response = await axios.get('/api/penalties/all', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });
      
      const penaltiesMap = {};
      response.data.forEach(penalty => {
        const dateStr = new Date(penalty.date).toISOString().split('T')[0];
        penaltiesMap[dateStr] = penalty.count || 0;
      });
      
      setPenaltyDates(penaltiesMap);
      setAllPenalties(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Ceza verileri alınamadı');
    }
  };

  const handleOpenAllPenaltiesDialog = () => {
    setAllPenaltiesDialog(true);
    fetchAllPenalties();
    // Scroll to bottom after dialog opens
    setTimeout(() => {
      const scrollContainer = document.getElementById('penalty-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 100);
  };

  const handleUpdatePenaltyForDate = async (date, count) => {
    try {
      await axios.post('/api/penalties/date', { date, count });
      setPenaltyDates(prev => ({ ...prev, [date]: count }));
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
        Günlük özet ve istatistikler
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* İstatistik Kartları */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    {stats.todayPenalties}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Bugünkü Ceza
                  </Typography>
                </Box>
                <Gavel sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    {activeMembers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Aktif Üye
                  </Typography>
                </Box>
                <People sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    {pendingTasks.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Bekleyen Görev
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white', height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                    {stats.weeklyTotal}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Bu Hafta Toplam
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: { xs: 32, sm: 40 }, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Çizgi Grafik - Haftalık Ceza Trendi */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Haftalık Ceza Trendi
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300 }, overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height="100%">
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
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ fill: '#1976d2', r: isMobile ? 3 : 5 }}
                  activeDot={{ r: isMobile ? 6 : 8 }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Pasta Grafik - Ceza Dağılımı */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
              <Assessment sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Görev & Ceza Dağılımı
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300 }, overflow: 'hidden' }}>
            {todayTasksPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={todayTasksPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => {
                      if (isMobile) {
                        return `${(percent * 100).toFixed(0)}%`;
                      }
                      return `${name}: ${value}`;
                    }}
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {todayTasksPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => ''}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    iconSize={isMobile ? 10 : 12}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  Bugün için veri yok
                </Typography>
              </Box>
            )}
            </Box>
          </Paper>
        </Grid>

        {/* Kayıtlı Üyeler */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
              <People sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Kayıtlı Üyeler
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {sortedMembers
                .slice((memberPage - 1) * membersPerPage, memberPage * membersPerPage)
                .map((member, index) => (
                  <Box key={member._id || member.id || member.username}>
                    <ListItem sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 1.5 } }}>
                      <ListItemAvatar>
                        <Avatar src={member.profileImage} sx={{ bgcolor: 'primary.main', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                          {getInitials(member.fullName)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 500 }}>
                            {member.fullName}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              component="span"
                              label={member.isCurrentlyActive ? 'Aktif' : 'Pasif'}
                              size="small"
                              color={member.isCurrentlyActive ? 'success' : 'default'}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                            />
                            <Chip
                              component="span"
                              label={member.role === 'admin' ? 'Admin' : member.role === 'ceza' ? 'Ceza' : 'Üye'}
                              size="small"
                              color={member.role === 'admin' ? 'primary' : member.role === 'ceza' ? 'warning' : 'default'}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                            />
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, wordBreak: 'break-all' }}>
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
                <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Kullanıcı listesi alınamadı.
                </Typography>
              )}
            </List>
            {sortedMembers.length > membersPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 1.5, sm: 2 } }}>
                <Pagination
                  count={Math.ceil(sortedMembers.length / membersPerPage)}
                  page={memberPage}
                  onChange={(e, page) => setMemberPage(page)}
                  size={isMobile ? 'small' : 'medium'}
                  color="primary"
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Önemli Görevler - Sadece admin ve ceza rolü görebilir */}
        {(user?.role === 'admin' || user?.role === 'ceza') && (
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
                <Warning sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Önemli Görevler (Kritik)
                </Typography>
              </Box>
              <List sx={{ py: 0 }}>
                {criticalTasks.map((task, index) => (
                  <Box key={task._id}>
                    <ListItem
                      onClick={() => window.open(`/dashboard/tasks/${task._id}`, '_blank')}
                      sx={{
                        bgcolor: task.completed ? 'action.hover' : 'transparent',
                        borderRadius: 1,
                        mb: 1,
                        cursor: 'pointer',
                        px: { xs: 1, sm: 2 },
                        py: { xs: 1, sm: 1.5 },
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        {task.completed ? (
                          <CheckCircle color="success" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        ) : (
                          <Schedule color="action" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                            <Typography
                              variant="body1"
                              sx={{
                                textDecoration: task.completed ? 'line-through' : 'none',
                                opacity: task.completed ? 0.6 : 1,
                                fontSize: { xs: '0.875rem', sm: '1rem' },
                                wordBreak: 'break-word',
                              }}
                            >
                              {/* Strip HTML tags and images, show only text content */}
                              {task.content ? stripHtmlAndImages(task.content) || 'İçerik yok' : 'İçerik yok'}
                            </Typography>
                            <Chip
                              label="Kritik"
                              size="small"
                              color="error"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                            />
                            <OpenInNew sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary', ml: 0.5 }} />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < criticalTasks.length - 1 && <Divider />}
                  </Box>
                ))}
                {criticalTasks.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: { xs: 1, sm: 2 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000,
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
          }}
          onClick={handleOpenAllPenaltiesDialog}
        >
          <Edit sx={{ fontSize: { xs: 24, sm: 28 } }} />
        </Fab>
      )}

      <Dialog 
        open={allPenaltiesDialog} 
        onClose={() => setAllPenaltiesDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: '90vh', sm: '85vh' },
          },
        }}
      >
        <DialogTitle sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Tüm Günlerdeki Ceza Sayılarını Düzenle
            </Typography>
            <IconButton onClick={() => setAllPenaltiesDialog(false)} size="small" sx={{ ml: 'auto' }}>
              ×
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 } }}>
          <Box 
            id="penalty-scroll-container"
            sx={{ maxHeight: { xs: '50vh', sm: '60vh' }, overflowY: 'auto', mt: { xs: 1, sm: 2 } }}
          >
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {Array.from({ length: 120 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (119 - i));
                const dateStr = date.toISOString().split('T')[0];
                const formattedDate = date.toLocaleDateString('tr-TR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                });
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                
                return (
                  <Grid item xs={6} sm={4} md={3} key={dateStr}>
                    <Box sx={{ 
                      p: { xs: 1, sm: 1.5 }, 
                      border: '1px solid', 
                      borderColor: isToday ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      bgcolor: isToday ? 'rgba(25, 118, 210, 0.08)' : 'background.paper',
                    }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: isToday ? 600 : 400, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {formattedDate} {isToday && '(Bugün)'}
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        value={penaltyDates[dateStr] || 0}
                        onChange={(e) => {
                          const newCount = parseInt(e.target.value) || 0;
                          setPenaltyDates(prev => ({ ...prev, [dateStr]: newCount }));
                          handleUpdatePenaltyForDate(dateStr, newCount);
                        }}
                        inputProps={{ min: 0 }}
                        sx={{ 
                          mt: 0.5,
                          '& .MuiOutlinedInput-root': {
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 1, sm: 2 }, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setAllPenaltiesDialog(false)} variant="contained" size={isMobile ? 'small' : 'medium'} fullWidth={isMobile}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MainPage;
