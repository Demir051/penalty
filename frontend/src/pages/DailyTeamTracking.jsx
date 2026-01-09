import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  Grid,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Save,
  Edit,
  CheckCircle,
  Cancel,
  Today,
  ArrowBackIos,
  ArrowForwardIos,
  Visibility,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

dayjs.locale('tr');

const TASK_OPTIONS = [
  'Ceza Kampanyası',
  'Sürücü Kontrol',
  'Yolcu Kontrol',
  'Gün Sonu Kontrolu',
  'Sürücü Beyan',
  'Yolcu Beyan',
  'Etiket',
  'Atama',
  'Noramin-WP',
  'Acil Mail',
  'TAG Destek Klasör',
  'Ödeme Mail',
  'Dekont / Süreç Arama',
  'Kaza',
  'Eğitim',
  'Diğer (?)',
];

const DailyTeamTracking = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check if user has access (only admin and ceza roles can access)
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin' && user.role !== 'ceza') {
      navigate('/dashboard');
      return;
    }
  }, [user, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/daily-tracking/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Kullanıcılar yüklenemedi' });
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/daily-tracking?date=${selectedDate}`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setMessage({ type: 'error', text: 'Günlük takip verileri yüklenemedi' });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'ceza')) {
      fetchUsers();
      fetchEntries();
    }
  }, [selectedDate, user]);

  const handleDateChange = (days) => {
    const newDate = dayjs(selectedDate).add(days, 'day');
    setSelectedDate(newDate.format('YYYY-MM-DD'));
  };

  const handleEdit = (entry) => {
    // Check if user can edit this entry
    const entryUserId = entry.user._id || entry.user;
    const currentUserId = user._id;
    
    if (user.role !== 'admin' && entryUserId.toString() !== currentUserId.toString()) {
      setMessage({ type: 'error', text: 'Sadece kendi kaydınızı düzenleyebilirsiniz' });
      return;
    }
    setEditingEntry({
      ...entry,
      userId: entryUserId,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        date: selectedDate,
        userId: editingEntry.userId,
        isHere: editingEntry.isHere,
        tasks: editingEntry.tasks,
        note: editingEntry.note || '',
      };

      await axios.post('/api/daily-tracking', payload);
      
      setMessage({ type: 'success', text: 'Kayıt başarıyla güncellendi' });
      setEditDialogOpen(false);
      setEditingEntry(null);
      fetchEntries();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving entry:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Kayıt güncellenirken hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (task) => {
    const currentTasks = editingEntry.tasks || [];
    const newTasks = currentTasks.includes(task)
      ? currentTasks.filter(t => t !== task)
      : [...currentTasks, task];
    
    setEditingEntry({
      ...editingEntry,
      tasks: newTasks,
    });
  };

  const getEntryForUser = (userId) => {
    return entries.find(e => {
      const entryUserId = e.user._id || e.user;
      return entryUserId.toString() === userId.toString();
    });
  };

  const canEditUser = (userId) => {
    return user.role === 'admin' || userId.toString() === user._id.toString();
  };

  if (authLoading || initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Günlük Takım Takibi
          </Typography>

          {message.text && (
            <Alert 
              severity={message.type} 
              sx={{ mb: 2 }}
              onClose={() => setMessage({ type: '', text: '' })}
            >
              {message.text}
            </Alert>
          )}

          {/* Date Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => handleDateChange(-1)}>
              <ArrowBackIos />
            </IconButton>
            <TextField
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              label="Tarih"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <IconButton onClick={() => handleDateChange(1)}>
              <ArrowForwardIos />
            </IconButton>
            <Chip
              icon={<Today />}
              label={dayjs(selectedDate).format('DD MMMM YYYY dddd')}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        {loading && !initialLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Kişi</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Burada Mı?</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Görevler</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Not</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Henüz takım üyesi bulunmuyor
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((teamUser) => {
                    const entry = getEntryForUser(teamUser._id);
                    const canEdit = canEditUser(teamUser._id);

                    return (
                      <TableRow key={teamUser._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={teamUser.profileImage || undefined}
                              sx={{ width: 40, height: 40 }}
                            >
                              {teamUser.fullName?.[0]?.toUpperCase() || teamUser.username?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {teamUser.fullName || teamUser.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {teamUser.role === 'admin' ? 'Admin' : 'Ceza'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          {entry ? (
                            entry.isHere ? (
                              <Chip
                                icon={<CheckCircle />}
                                label="Evet"
                                color="success"
                                size="small"
                              />
                            ) : (
                              <Chip
                                icon={<Cancel />}
                                label="Hayır"
                                color="default"
                                size="small"
                              />
                            )
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry && entry.tasks && entry.tasks.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {entry.tasks.map((task) => (
                                <Chip
                                  key={task}
                                  label={task}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry?.note ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                maxWidth: 300,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1,
                                  color: 'text.primary',
                                }}
                              >
                                {entry.note}
                              </Typography>
                              <Tooltip title="Notu gör">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedNote(entry.note);
                                    setNoteDialogOpen(true);
                                  }}
                                  sx={{
                                    opacity: 0.6,
                                    '&:hover': {
                                      opacity: 1,
                                    },
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {canEdit ? (
                            <Tooltip title={entry ? 'Düzenle' : 'Kayıt Oluştur'}>
                              <IconButton
                                color="primary"
                                onClick={() =>
                                  handleEdit(
                                    entry || {
                                      user: teamUser,
                                      isHere: false, // Default hayır
                                      tasks: [],
                                      note: '',
                                    }
                                  )
                                }
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Sadece kendi kaydınızı düzenleyebilirsiniz">
                              <span>
                                <IconButton disabled>
                                  <Edit />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingEntry(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={editingEntry?.user?.profileImage || undefined}
              sx={{ width: 40, height: 40 }}
            >
              {editingEntry?.user?.fullName?.[0]?.toUpperCase() ||
                editingEntry?.user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {editingEntry?.user?.fullName || editingEntry?.user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(selectedDate).format('DD MMMM YYYY')}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Burada Mı? */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={editingEntry?.isHere || false}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      isHere: e.target.checked,
                    })
                  }
                />
              }
              label="Burada Mı?"
            />

            {/* Tasks */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Görevler
              </Typography>
              <Grid container spacing={1}>
                {TASK_OPTIONS.map((task) => (
                  <Grid item xs={12} sm={6} md={4} key={task}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editingEntry?.tasks?.includes(task) || false}
                          onChange={() => handleTaskToggle(task)}
                        />
                      }
                      label={task}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Note */}
            <TextField
              label="Not"
              multiline
              rows={4}
              fullWidth
              value={editingEntry?.note || ''}
              onChange={(e) =>
                setEditingEntry({
                  ...editingEntry,
                  note: e.target.value,
                })
              }
              placeholder="Ek notlarınızı buraya yazabilirsiniz..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingEntry(null);
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note View Dialog */}
      <Dialog
        open={noteDialogOpen}
        onClose={() => {
          setNoteDialogOpen(false);
          setSelectedNote('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Not Detayı
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              py: 2,
              color: 'text.primary',
            }}
          >
            {selectedNote || '-'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setNoteDialogOpen(false);
              setSelectedNote('');
            }}
            variant="contained"
          >
            Kapat
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DailyTeamTracking;

