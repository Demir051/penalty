import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Schedule,
  Comment as CommentIcon,
  Send,
} from '@mui/icons-material';
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

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tasks');
        const foundTask = response.data.find(t => t._id === taskId);
        
        if (!foundTask) {
          setError('Görev bulunamadı');
          return;
        }
        
        setTask(foundTask);
      } catch (err) {
        setError('Görev yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    
    try {
      setSubmitting(true);
      await axios.post(`/api/tasks/${taskId}/comments`, { message: commentInput.trim() });
      setCommentInput('');
      
      // Refresh task data
      const response = await axios.get('/api/tasks');
      const foundTask = response.data.find(t => t._id === taskId);
      if (foundTask) {
        setTask(foundTask);
      }
    } catch (err) {
      setError('Yorum eklenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      await axios.patch(`/api/tasks/${taskId}/complete`);
      const response = await axios.get('/api/tasks');
      const foundTask = response.data.find(t => t._id === taskId);
      if (foundTask) {
        setTask(foundTask);
      }
    } catch (err) {
      setError('Görev tamamlanırken bir hata oluştu');
    }
  };

  const handleUncomplete = async () => {
    try {
      await axios.patch(`/api/tasks/${taskId}/uncomplete`);
      const response = await axios.get('/api/tasks');
      const foundTask = response.data.find(t => t._id === taskId);
      if (foundTask) {
        setTask(foundTask);
      }
    } catch (err) {
      setError('Görev geri alınırken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !task) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/tasks')}
          sx={{ mt: 2 }}
        >
          Görevlere Dön
        </Button>
      </Container>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/tasks')}
            variant="outlined"
            size="small"
          >
            Geri Dön
          </Button>
          {!task.completed ? (
            <Button
              startIcon={<CheckCircle />}
              onClick={handleComplete}
              variant="contained"
              color="success"
              size="small"
            >
              Görevi Tamamla
            </Button>
          ) : (
            <Button
              startIcon={<Schedule />}
              onClick={handleUncomplete}
              variant="outlined"
              size="small"
            >
              Görevi Geri Al
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Task Content */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
            <Avatar src={task.authorImage || undefined} sx={{ width: 40, height: 40 }}>
              {task.authorName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="600">
                  {task.authorName || 'Bilinmiyor'}
                </Typography>
                <Chip
                  label={priorityLabel[task.priority] || 'Normal'}
                  color={priorityColor[task.priority]}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                {task.completed && (
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                    label="Tamamlandı"
                    color="success"
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {dayjs(task.createdAt).format('DD.MM.YYYY HH:mm')} • {dayjs(task.createdAt).fromNow()}
              </Typography>
            </Box>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              bgcolor: 'background.default',
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}>
              {task.content}
            </Typography>
          </Paper>

          {task.completed && task.completedBy && (
            <Box sx={{ 
              mt: 2, 
              p: 1.5, 
              bgcolor: 'success.dark',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'success.main',
            }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircle sx={{ fontSize: 18, color: 'success.contrastText' }} />
                <Typography variant="caption" sx={{ color: 'success.contrastText', fontSize: '0.8rem' }}>
                  <strong>{task.completedByName || 'Bilinmiyor'}</strong> tarafından{' '}
                  {dayjs(task.completedAt).format('DD.MM.YYYY HH:mm')} tarihinde tamamlandı
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Comments Section */}
        <Box>
          <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, fontSize: '1rem' }}>
            Yorumlar ({task.comments?.length || 0})
          </Typography>

          {/* Add Comment */}
          <Box sx={{ mb: 2.5 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Yorum ekle..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleAddComment}
              disabled={!commentInput.trim() || submitting}
              size="small"
            >
              Yorum Ekle
            </Button>
          </Box>

          {/* Comments List */}
          {task.comments && task.comments.length > 0 ? (
            <List>
              {task.comments.map((comment, index) => (
                <Box key={comment._id || index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={comment.authorImage || undefined} sx={{ width: 32, height: 32 }}>
                        {comment.authorName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                            {comment.authorName || 'Bilinmiyor'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {dayjs(comment.createdAt).format('DD.MM.YYYY HH:mm')} • {dayjs(comment.createdAt).fromNow()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontSize: '0.875rem',
                            lineHeight: 1.6,
                          }}
                        >
                          {comment.message}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < task.comments.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Henüz yorum yok. İlk yorumu siz ekleyin!
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TaskDetail;

