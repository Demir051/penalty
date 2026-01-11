import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ErrorPage from './ErrorPage';
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
  ArrowBack,
  CheckCircle,
  Schedule,
  Comment as CommentIcon,
  Send,
  Edit,
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editing, setEditing] = useState(false);
  const quillEditRef = useRef(null);
  const [imageDialog, setImageDialog] = useState({ open: false, url: '', width: '100%', height: 'auto' });
  const [pendingImageIndex, setPendingImageIndex] = useState(null);

  // Quill modules configuration
  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        link: function(value) {
          const quill = quillEditRef.current?.getEditor();
          if (!quill) return;
          if (value) {
            const range = quill.getSelection(true);
            if (!range) return;
            const text = quill.getText(range.index, range.length);
            let url = prompt('Link URL girin:', text || '');
            if (url) {
              // If URL doesn't start with http:// or https://, add http://
              if (!url.match(/^https?:\/\//i)) {
                url = 'http://' + url;
              }
              quill.format('link', url);
            }
          } else {
            quill.format('link', false);
          }
        },
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();
          
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            
            if (file.size > 5 * 1024 * 1024) {
              setError('Resim boyutu 5MB\'dan küçük olmalıdır');
              return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
              const quill = quillEditRef.current?.getEditor();
              if (!quill) return;
              const range = quill.getSelection(true);
              if (range) {
                const imageUrl = e.target?.result;
                // Store the range index and open dialog for size adjustment
                setPendingImageIndex(range.index);
                setImageDialog({ 
                  open: true, 
                  url: imageUrl, 
                  width: '100%', 
                  height: 'auto' 
                });
              }
            };
            reader.readAsDataURL(file);
          };
        }
      }
    }
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'link', 'image'
  ];

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError('Görev ID bulunamadı');
        setLoading(false);
        return;
      }

      // Validate MongoDB ObjectId format (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(taskId)) {
        setError('Geçersiz görev ID formatı');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`/api/tasks/${taskId}`);
        
        if (!response.data) {
          setError('Görev bulunamadı');
          return;
        }
        
        setTask(response.data);
      } catch (err) {
        console.error('Error fetching task:', err);
        if (err.response?.status === 400 || err.response?.status === 404) {
          setError('Görev bulunamadı veya geçersiz ID formatı');
        } else {
          setError(err.response?.data?.message || 'Görev yüklenirken bir hata oluştu');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    
    try {
      setSubmitting(true);
      await axios.post(`/api/tasks/${taskId}/comments`, { message: commentInput.trim() });
      setCommentInput('');
      
      // Refresh task data
      const response = await axios.get(`/api/tasks/${taskId}`);
      if (response.data) {
        setTask(response.data);
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
      const response = await axios.get(`/api/tasks/${taskId}`);
      if (response.data) {
        setTask(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Görev tamamlanırken bir hata oluştu');
    }
  };

  const handleUncomplete = async () => {
    try {
      await axios.patch(`/api/tasks/${taskId}/uncomplete`);
      const response = await axios.get(`/api/tasks/${taskId}`);
      if (response.data) {
        setTask(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Görev geri alınırken bir hata oluştu');
    }
  };

  const handleEditClick = () => {
    setEditContent(task.content || '');
    setEditPriority(task.priority || 'normal');
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    const textContent = editContent.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      setError('Görev içeriği boş olamaz');
      return;
    }

    try {
      setEditing(true);
      setError('');
      await axios.patch(`/api/tasks/${taskId}`, {
        content: editContent,
        priority: editPriority,
      });
      
      const response = await axios.get(`/api/tasks/${taskId}`);
      if (response.data) {
        setTask(response.data);
      }
      
      setEditDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Görev güncellenirken bir hata oluştu');
    } finally {
      setEditing(false);
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

  if (error && !task && !loading) {
    // Check if it's an invalid ID format error
    if (error.includes('Geçersiz') || error.includes('geçersiz') || error.includes('Invalid')) {
      return (
        <ErrorPage
          title="Geçersiz Görev ID"
          message="Girdiğiniz görev ID formatı geçersiz. Lütfen geçerli bir görev ID'si kullanın."
          showBackButton={true}
        />
      );
    }
    return (
      <ErrorPage
        title="Görev Bulunamadı"
        message={error || "Aradığınız görev bulunamadı veya erişim yetkiniz bulunmamaktadır."}
        showBackButton={true}
      />
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/tasks')}
            variant="outlined"
            size="small"
          >
            Geri Dön
          </Button>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {/* Edit button - only show if user is author or admin */}
            {task && user && (
              user.role === 'admin' || 
              (task.author && (
                (typeof task.author === 'object' && task.author._id && task.author._id.toString() === user._id?.toString()) ||
                (typeof task.author === 'string' && task.author.toString() === user._id?.toString())
              ))
            ) && (
              <Button
                startIcon={<Edit />}
                onClick={handleEditClick}
                variant="outlined"
                size="small"
              >
                Düzenle
              </Button>
            )}
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
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Task Content */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
            <Avatar 
              src={
                (task.authorImage || (task.author && task.author.profileImage)) 
                  ? (() => {
                      const imgUrl = task.authorImage || (task.author && task.author.profileImage);
                      if (imgUrl && (imgUrl.startsWith('http') || imgUrl.startsWith('data:'))) return imgUrl;
                      return `${axios.defaults.baseURL || window.location.origin}${imgUrl?.startsWith('/') ? '' : '/'}${imgUrl}`;
                    })()
                  : undefined
              } 
              sx={{ width: 40, height: 40 }}
            >
              {(task.authorName || (task.author && (task.author.fullName || task.author.username)))?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight="600">
                  {task.authorName || (task.author && (task.author.fullName || task.author.username)) || 'Bilinmiyor'}
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
            <Box 
              sx={{ 
                wordBreak: 'break-word', 
                lineHeight: 1.7,
                '& img': {
                  display: 'block !important',
                  maxWidth: '100% !important',
                  borderRadius: '8px !important',
                  margin: '16px auto !important',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  clear: 'both',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                },
                '& p': {
                  margin: '0.5em 0',
                  '&:has(img)': {
                    margin: '16px 0 !important',
                  },
                  '& img': {
                    display: 'block !important',
                    margin: '16px auto !important',
                    clear: 'both',
                  },
                },
                '& ul, & ol': {
                  marginLeft: '1.5em',
                },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
              }}
              dangerouslySetInnerHTML={{ __html: task.content }}
            />
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
                      <Avatar 
                        src={
                          (comment.authorImage || (comment.author && comment.author.profileImage))
                            ? (() => {
                                const imgUrl = comment.authorImage || (comment.author && comment.author.profileImage);
                                if (imgUrl && (imgUrl.startsWith('http') || imgUrl.startsWith('data:'))) return imgUrl;
                                return `${axios.defaults.baseURL || window.location.origin}${imgUrl?.startsWith('/') ? '' : '/'}${imgUrl}`;
                              })()
                            : undefined
                        } 
                        sx={{ width: 32, height: 32 }}
                      >
                        {(comment.authorName || (comment.author && (comment.author.fullName || comment.author.username)))?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" fontWeight="600" sx={{ fontSize: '0.8rem' }}>
                            {comment.authorName || (comment.author && (comment.author.fullName || comment.author.username)) || 'Bilinmiyor'}
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

      {/* Edit Task Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !editing && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        keepMounted={false}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            minHeight: '400px',
          }
        }}
      >
        <DialogTitle>Görevi Düzenle</DialogTitle>
        <DialogContent sx={{ minHeight: '350px' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Görev açıklaması
              </Typography>
              <Box sx={{ 
                minHeight: '280px',
                position: 'relative',
                '& .quill': {
                  width: '100% !important',
                  display: 'flex !important',
                  flexDirection: 'column !important',
                  minHeight: '280px !important',
                },
                '& .ql-container': {
                  minHeight: '240px !important',
                  bgcolor: 'background.paper !important',
                  fontSize: '1rem',
                },
                '& .ql-toolbar': {
                  borderRadius: '4px 4px 0 0',
                  border: '1px solid !important',
                  borderColor: 'divider !important',
                  bgcolor: 'background.default !important',
                  display: 'flex !important',
                  flexWrap: 'wrap',
                  padding: '8px !important',
                  '& .ql-picker-label': {
                    color: 'text.primary !important',
                  },
                  '& .ql-stroke': {
                    stroke: 'text.primary !important',
                  },
                  '& .ql-fill': {
                    fill: 'text.primary !important',
                  },
                  '& button': {
                    color: 'text.primary !important',
                  },
                },
                '& .ql-container.ql-snow': {
                  border: '1px solid !important',
                  borderColor: 'divider !important',
                  borderRadius: '0 0 4px 4px',
                  bgcolor: 'background.paper !important',
                  borderTop: 'none !important',
                },
                '& .ql-editor': {
                  minHeight: '240px !important',
                  color: 'text.primary !important',
                  padding: '12px !important',
                  '&.ql-blank::before': {
                    fontStyle: 'normal',
                    color: 'text.secondary',
                    opacity: 0.6,
                    left: '12px !important',
                  },
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    my: 1,
                  },
                },
              }}>
                <ReactQuill
                  key={`edit-quill-${editDialogOpen}-${editContent ? 'has-content' : 'no-content'}`}
                  ref={quillEditRef}
                  theme="snow"
                  value={editContent}
                  onChange={setEditContent}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Görev açıklaması girin..."
                  style={{ 
                    width: '100%', 
                    display: editDialogOpen ? 'flex' : 'none', 
                    flexDirection: 'column', 
                    minHeight: '280px' 
                  }}
                />
              </Box>
            </Box>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Öncelik</InputLabel>
              <Select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                label="Öncelik"
              >
                <MenuItem value="critical">Kritik</MenuItem>
                <MenuItem value="medium">Orta</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editing}>
            İptal
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained" 
            disabled={editing || !editContent.replace(/<[^>]*>/g, '').trim()}
          >
            {editing ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Size Dialog for TaskDetail */}
      <Dialog 
        open={imageDialog.open} 
        onClose={() => {
          setImageDialog({ open: false, url: '', width: '100%', height: 'auto' });
          setPendingImageIndex(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resim Boyutunu Ayarla</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img 
                src={imageDialog.url} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px', 
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: 'divider'
                }} 
              />
            </Box>
            <TextField
              label="Genişlik (%)"
              type="number"
              value={imageDialog.width === '100%' ? 100 : parseInt(imageDialog.width) || 100}
              onChange={(e) => {
                const width = e.target.value;
                setImageDialog(prev => ({ ...prev, width: width ? `${width}%` : '100%' }));
              }}
              inputProps={{ min: 10, max: 100 }}
              helperText="Genişlik yüzdesi (10-100)"
              fullWidth
            />
            <TextField
              label="Yükseklik (px) - 'auto' için boş bırakın"
              type="text"
              value={imageDialog.height === 'auto' ? '' : imageDialog.height.replace('px', '')}
              onChange={(e) => {
                const height = e.target.value;
                setImageDialog(prev => ({ 
                  ...prev, 
                  height: height && !isNaN(height) ? `${height}px` : 'auto' 
                }));
              }}
              placeholder="auto"
              helperText="Yükseklik piksel cinsinden (boş bırakırsanız otomatik)"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImageDialog({ open: false, url: '', width: '100%', height: 'auto' });
            setPendingImageIndex(null);
          }}>
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              const quill = quillEditRef.current?.getEditor();
              if (quill && pendingImageIndex !== null) {
                try {
                  const beforeText = quill.getText(0, pendingImageIndex);
                  let insertIndex = pendingImageIndex;
                  if (beforeText && beforeText.trim() && !beforeText.endsWith('\n')) {
                    quill.insertText(pendingImageIndex, '\n', 'user');
                    insertIndex = pendingImageIndex + 1;
                  }
                  
                  quill.setSelection(insertIndex, 'user');
                  quill.insertEmbed(insertIndex, 'image', imageDialog.url, 'user');
                  quill.insertText(insertIndex + 1, '\n', 'user');
                  quill.setSelection(insertIndex + 2, 'user');
                  
                  setTimeout(() => {
                    const imgs = quill.root.querySelectorAll('img');
                    const img = Array.from(imgs).find(img => img.src === imageDialog.url);
                    
                    if (img) {
                      img.style.cssText = `display: block !important; width: ${imageDialog.width} !important; height: ${imageDialog.height} !important; margin: 16px auto !important; border-radius: 8px !important; max-width: 100% !important;`;
                      
                      let parent = img.parentNode;
                      if (!parent || parent.tagName !== 'P') {
                        const p = document.createElement('p');
                        if (parent && parent.parentNode) {
                          parent.parentNode.insertBefore(p, parent);
                          parent.removeChild(img);
                          p.appendChild(img);
                          if (!parent.textContent.trim() && !parent.querySelector('br')) {
                            parent.remove();
                          }
                        } else {
                          quill.root.appendChild(p);
                          if (parent) parent.removeChild(img);
                          p.appendChild(img);
                        }
                      }
                      
                      quill.update();
                      const newLength = quill.getLength();
                      if (insertIndex + 2 < newLength) {
                        quill.setSelection(insertIndex + 2, 'user');
                      } else {
                        quill.setSelection(newLength, 'user');
                      }
                    }
                  }, 200);
                } catch (error) {
                  console.error('Error inserting image:', error);
                  setError('Resim eklenirken bir hata oluştu');
                }
              }
              setImageDialog({ open: false, url: '', width: '100%', height: 'auto' });
              setPendingImageIndex(null);
            }}
          >
            Ekle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TaskDetail;

