import { useState, useEffect } from 'react';
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

const MainPage = () => {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    todayPenalties: 0,
    weeklyData: [],
    penaltyTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const criticalTasks = tasks.filter((t) => !t.completed && t.priority === 'critical');

  useEffect(() => {
    fetchDashboardData();
    // Her 30 saniyede bir güncelle
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      try {
        const resUsers = await axios.get('/users');
        setMembers(resUsers.data || []);
      } catch (err) {
        setMembers([]);
      }

      // İstatistikleri getir (şimdilik mock data)
      const today = new Date();
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        weeklyData.push({
          date: date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
          ceza: Math.floor(Math.random() * 20) + 5,
        });
      }

      setStats({
        todayPenalties: Math.floor(Math.random() * 15) + 10,
        weeklyData,
        penaltyTypes: [],
      });

      // Görevleri getir
      try {
        setBusy(true);
        const response = await axios.get('/tasks');
        setTasks(response.data || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      } finally {
        setBusy(false);
      }

      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
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
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
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
                    {members.length}
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
                    {stats.weeklyData.reduce((sum, d) => sum + d.ceza, 0)}
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
                <YAxis />
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
                    { name: 'Tamamlanan Görevler', value: completedTasks.length, color: '#22c55e' },
                    { name: 'Cezalar', value: 40, color: '#8884d8' },
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
              {members.map((member, index) => (
                <Box key={member._id || member.id || member.username}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getInitials(member.fullName)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.fullName}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={member.isActive === false ? 'Pasif' : 'Aktif'}
                            size="small"
                            color={member.isActive === false ? 'default' : 'success'}
                          />
                          <Chip
                            label={member.role === 'admin' ? 'Admin' : 'Üye'}
                            size="small"
                            color={member.role === 'admin' ? 'primary' : 'default'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < members.length - 1 && <Divider />}
                </Box>
              ))}
              {members.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Kullanıcı listesi alınamadı.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Önemli Görevler */}
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

        {/* Son Görevler */}
        {tasks.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Son Görevler
                </Typography>
              </Box>
              <List>
                {tasks.map((task, index) => (
                  <Box key={task._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {task.authorName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={task.content}
                        secondary={`${task.authorName || 'Unknown'} • ${new Date(task.createdAt).toLocaleDateString('tr-TR')}`}
                      />
                    </ListItem>
                    {index < tasks.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default MainPage;
