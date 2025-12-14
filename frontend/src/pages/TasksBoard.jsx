import { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Stack,
  TextField,
  Button,
  Chip,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
  Popper,
  Paper as MuiPaper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { Assignment, Comment as CommentIcon, CheckCircle, Delete } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';
import { useAuth } from '../context/AuthContext';

dayjs.extend(relativeTime);
dayjs.locale('tr');

const priorityColor = {
  critical: 'error',
  medium: 'warning',
  normal: 'success',
};

const priorityLabel = {
  critical: 'Kritik',
  medium: 'Orta',
  normal: 'Normal',
};

const sortTasks = (tasks) => {
  const priorityOrder = { critical: 0, medium: 1, normal: 2 };
  return [...tasks].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

const TasksBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState(0); // 0: aktif, 1: tamamlanan
  const [newTask, setNewTask] = useState({ content: '', priority: 'normal' });
  const [commentInputs, setCommentInputs] = useState({});
  const [commentExpanded, setCommentExpanded] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuth();
  const [confirm, setConfirm] = useState({ open: false, type: '', taskId: null, commentId: null });
  const [users, setUsers] = useState([]);
  const [mentionOpen, setMentionOpen] = useState({ taskId: null, position: null });
  const [mentionQuery, setMentionQuery] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Görevler alınamadı' });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    const interval = setInterval(fetchTasks, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.content.trim()) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post('/tasks', newTask);
      setNewTask({ content: '', priority: 'normal' });
      await fetchTasks();
      setMessage({ type: 'success', text: 'Görev eklendi' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Görev eklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  // @mention helper functions
  const getMentionSuggestions = (text, cursorPosition) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const match = beforeCursor.match(/@(\w*)$/);
    if (!match) return [];
    const query = match[1].toLowerCase();
    return users.filter(u => 
      (u.username?.toLowerCase().includes(query) || 
       u.fullName?.toLowerCase().includes(query)) &&
      u._id !== user?.id
    ).slice(0, 5);
  };

  const insertMention = (text, cursorPosition, username) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const startPos = cursorPosition - mentionMatch[0].length;
      return text.substring(0, startPos) + `@${username} ` + afterCursor;
    }
    return text;
  };

  const handleComplete = async (taskId) => {
    try {
      await axios.patch(`/tasks/${taskId}/complete`);
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Görev tamamlanamadı' });
    }
  };

  const handleUncomplete = async (taskId) => {
    try {
      await axios.patch(`/tasks/${taskId}/uncomplete`);
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Görev geri alınamadı' });
    }
  };

  const handleAddComment = async (taskId) => {
    const messageText = commentInputs[taskId]?.trim();
    if (!messageText) return;
    try {
      await axios.post(`/tasks/${taskId}/comments`, { message: messageText });
      setCommentInputs((prev) => ({ ...prev, [taskId]: '' }));
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Yorum eklenemedi' });
    }
  };

  const askDeleteTask = (taskId) => {
    setConfirm({ open: true, type: 'task', taskId, commentId: null });
  };

  const askDeleteComment = (taskId, commentId) => {
    setConfirm({ open: true, type: 'comment', taskId, commentId });
  };

  const handleConfirm = async () => {
    if (confirm.type === 'task' && confirm.taskId) {
      await handleDeleteTask(confirm.taskId);
    } else if (confirm.type === 'comment' && confirm.taskId && confirm.commentId) {
      await handleDeleteComment(confirm.taskId, confirm.commentId);
    }
    setConfirm({ open: false, type: '', taskId: null, commentId: null });
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/tasks/${taskId}`);
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Görev silinemedi' });
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    try {
      await axios.delete(`/tasks/${taskId}/comments/${commentId}`);
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Yorum silinemedi' });
    }
  };

  const visibleComments = (task) => {
    const comments = task.comments || [];
    if (comments.length <= 3 || commentExpanded[task._id]) return comments;
    return comments.slice(0, 3);
  };

  const toggleComments = (taskId) => {
    setCommentExpanded((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const activeTasks = useMemo(
    () => sortTasks(tasks.filter((t) => !t.completed)),
    [tasks]
  );
  const completedTasks = useMemo(
    () => sortTasks(tasks.filter((t) => t.completed)),
    [tasks]
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Görev Oluştur
        </Typography>
        <form onSubmit={handleAddTask}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ position: 'relative', flex: 1 }}>
              <TextField
                fullWidth
                label="Görev açıklaması"
                value={newTask.content}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewTask((prev) => ({ ...prev, content: value }));
                  // Check for @mention
                  const cursorPos = e.target.selectionStart || value.length;
                  const suggestions = getMentionSuggestions(value, cursorPos);
                  if (suggestions.length > 0) {
                    setMentionOpen({ taskId: 'new', position: cursorPos });
                    setMentionQuery(suggestions[0]?.username || '');
                  } else {
                    setMentionOpen({ taskId: null, position: null });
                  }
                }}
                onKeyDown={(e) => {
                  if (mentionOpen.taskId === 'new' && e.key === 'Enter' && !e.shiftKey) {
                    const suggestions = getMentionSuggestions(newTask.content, mentionOpen.position);
                    if (suggestions.length > 0 && !e.ctrlKey) {
                      e.preventDefault();
                      const newContent = insertMention(newTask.content, mentionOpen.position, suggestions[0].username);
                      setNewTask((prev) => ({ ...prev, content: newContent }));
                      setMentionOpen({ taskId: null, position: null });
                    }
                  }
                }}
                required
              />
              {mentionOpen.taskId === 'new' && (
                <Paper
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    mt: 0.5,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  <List dense>
                    {getMentionSuggestions(newTask.content, mentionOpen.position).map((u) => (
                      <ListItem
                        key={u._id}
                        button
                        onClick={() => {
                          const newContent = insertMention(newTask.content, mentionOpen.position, u.username);
                          setNewTask((prev) => ({ ...prev, content: newContent }));
                          setMentionOpen({ taskId: null, position: null });
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={u.profileImage} sx={{ width: 24, height: 24 }}>
                            {u.fullName?.[0] || u.username?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={u.fullName || u.username}
                          secondary={`@${u.username}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
            <TextField
              select
              label="Öncelik"
              value={newTask.priority}
              onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
              SelectProps={{ native: true }}
              sx={{ minWidth: 160 }}
            >
              <option value="critical">Kritik</option>
              <option value="medium">Orta</option>
              <option value="normal">Normal</option>
            </TextField>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Ekleniyor...' : 'Görev Ekle'}
            </Button>
          </Stack>
        </form>
      </Paper>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 0, position: 'relative' }}>
        {initialLoading && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', zIndex: 1 }}>
            <CircularProgress />
          </Box>
        )}
        <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Görevler
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aktif: {activeTasks.length} • Tamamlanan: {completedTasks.length}
            </Typography>
          </Box>
          <Tabs value={tab} onChange={(_, val) => setTab(val)}>
            <Tab label="Aktif Görevler" />
            <Tab label="Tamamlanan Görevler" />
          </Tabs>
        </Box>

        <Divider sx={{ mt: 1 }} />

        <Box sx={{ p: 3 }}>
          {(tab === 0 ? activeTasks : completedTasks).map((task) => (
            <Paper key={task._id} variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }} src={task.authorImage || undefined}>
                      {task.authorName?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="bold">{task.authorName || 'Bilinmiyor'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(task.createdAt).format('DD.MM.YYYY HH:mm')} ({dayjs(task.createdAt).fromNow()})
                      </Typography>
                    </Box>
                    <Chip
                      label={priorityLabel[task.priority] || 'Normal'}
                      color={priorityColor[task.priority]}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Stack>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {task.content}
                  </Typography>
                  {task.completed && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircle color="success" fontSize="small" />
                      <Avatar sx={{ width: 28, height: 28 }} src={task.completedByImage || undefined}>
                        {task.completedByName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {task.completedByName || 'Bilinmiyor'} tarafından {dayjs(task.completedAt).format('DD.MM.YYYY HH:mm')} tarihinde tamamlandı
                      </Typography>
                    </Stack>
                  )}
                </Box>
                <Box>
                  {task.completed ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button variant="outlined" size="small" onClick={() => handleUncomplete(task._id)}>
                        Geri Al
                      </Button>
                      {(user?.role === 'admin' || task.author === user?.id || task.author?._id === user?.id) && (
                        <Tooltip title="Görevi Sil">
                          <IconButton color="error" size="small" onClick={() => askDeleteTask(task._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" size="small" onClick={() => handleComplete(task._id)}>
                        Görevi Bitir
                      </Button>
                      {(user?.role === 'admin' || task.author === user?.id || task.author?._id === user?.id) && (
                        <Tooltip title="Görevi Sil">
                          <IconButton color="error" size="small" onClick={() => askDeleteTask(task._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  )}
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <CommentIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">Yorumlar</Typography>
              </Stack>

              <Stack spacing={1} sx={{ mb: 1 }}>
                {visibleComments(task).map((comment, idx) => (
                  <Box key={comment._id || idx} sx={{ p: 1.2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28 }} src={comment.authorImage || undefined}>
                        {comment.authorName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {comment.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(comment.createdAt).format('DD.MM.YYYY HH:mm')} ({dayjs(comment.createdAt).fromNow()})
                        </Typography>
                      </Box>
                      <Box sx={{ flexGrow: 1 }} />
                      {(user?.role === 'admin' || comment.author === user?.id || comment.author?._id === user?.id) && (
                        <Tooltip title="Yorumu Sil">
                          <IconButton size="small" color="error" onClick={() => askDeleteComment(task._id, comment._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5, ml: 0.5 }}>
                      {comment.message}
                    </Typography>
                  </Box>
                ))}
                {(!task.comments || task.comments.length === 0) && (
                  <Typography variant="body2" color="text.secondary">
                    Henüz yorum yok.
                  </Typography>
                )}
                {task.comments && task.comments.length > 3 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => toggleComments(task._id)}
                    sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                  >
                    {commentExpanded[task._id]
                      ? 'Daha az göster'
                      : `${task.comments.length - 3} yorum daha gör`}
                  </Button>
                )}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Box sx={{ position: 'relative', flex: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Yorum yaz... (@ ile kullanıcı bahset)"
                    value={commentInputs[task._id] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCommentInputs((prev) => ({ ...prev, [task._id]: value }));
                      // Check for @mention
                      const cursorPos = e.target.selectionStart || value.length;
                      const suggestions = getMentionSuggestions(value, cursorPos);
                      if (suggestions.length > 0) {
                        setMentionOpen({ taskId: task._id, position: cursorPos });
                        setMentionQuery(suggestions[0]?.username || '');
                      } else {
                        if (mentionOpen.taskId === task._id) {
                          setMentionOpen({ taskId: null, position: null });
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (mentionOpen.taskId === task._id && e.key === 'Enter' && !e.shiftKey) {
                        const suggestions = getMentionSuggestions(commentInputs[task._id] || '', mentionOpen.position);
                        if (suggestions.length > 0 && !e.ctrlKey) {
                          e.preventDefault();
                          const currentComment = commentInputs[task._id] || '';
                          const newComment = insertMention(currentComment, mentionOpen.position, suggestions[0].username);
                          setCommentInputs((prev) => ({ ...prev, [task._id]: newComment }));
                          setMentionOpen({ taskId: null, position: null });
                        }
                      }
                    }}
                  />
                  {mentionOpen.taskId === task._id && (
                    <Paper
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        mt: 0.5,
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <List dense>
                        {getMentionSuggestions(commentInputs[task._id] || '', mentionOpen.position).map((u) => (
                          <ListItem
                            key={u._id}
                            button
                            onClick={() => {
                              const currentComment = commentInputs[task._id] || '';
                              const newComment = insertMention(currentComment, mentionOpen.position, u.username);
                              setCommentInputs((prev) => ({ ...prev, [task._id]: newComment }));
                              setMentionOpen({ taskId: null, position: null });
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar src={u.profileImage} sx={{ width: 24, height: 24 }}>
                                {u.fullName?.[0] || u.username?.[0]}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={u.fullName || u.username}
                              secondary={`@${u.username}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
                <Button variant="outlined" onClick={() => handleAddComment(task._id)}>
                  Gönder
                </Button>
              </Stack>
            </Paper>
          ))}

          {(tab === 0 ? activeTasks : completedTasks).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Görev bulunamadı.
            </Typography>
          )}
        </Box>
      </Paper>

      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, type: '', taskId: null, commentId: null })}>
        <DialogTitle>Onay</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm.type === 'task'
              ? 'Görevi silmek istediğinize emin misiniz?'
              : 'Yorumu silmek istediğinize emin misiniz?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, type: '', taskId: null, commentId: null })}>Vazgeç</Button>
          <Button color="error" onClick={handleConfirm}>Sil</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TasksBoard;

