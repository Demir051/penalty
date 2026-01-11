import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Assignment, Comment as CommentIcon, CheckCircle, Delete, OpenInNew, Edit } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState({ open: false, type: '', taskId: null, commentId: null });
  const [users, setUsers] = useState([]);
  const [mentionOpen, setMentionOpen] = useState({ taskId: null, position: null });
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionDialog, setMentionDialog] = useState({ open: false, mention: '', mentionedUsers: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMentionOpen, setSearchMentionOpen] = useState(false);
  const [searchMentionPosition, setSearchMentionPosition] = useState(0);
  const quillRef = useRef(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editing, setEditing] = useState(false);
  const quillEditRef = useRef(null);
  const [imageDialog, setImageDialog] = useState({ open: false, url: '', width: 400, height: 300 });
  const [pendingImageIndex, setPendingImageIndex] = useState(null);

  // Check if user has access (only admin and ceza roles can access)
  useEffect(() => {
    if (!authLoading && user && user.role === 'uye') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Görevler alınamadı' });
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching users:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Only fetch if user has access
    if (user && user.role !== 'uye') {
      fetchTasks();
      fetchUsers();
      // Optimize polling: increase interval to 30 seconds for better performance
      // Use longer interval when tab is not visible
      let interval;
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Tab is hidden, stop polling
          if (interval) clearInterval(interval);
        } else {
          // Tab is visible, resume polling
          if (interval) clearInterval(interval);
          interval = setInterval(fetchTasks, 30000); // 30 seconds
        }
      };
      
      // Start polling
      interval = setInterval(fetchTasks, 30000);
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, fetchUsers]);

  // Debug: Check if ReactQuill is mounted
  useEffect(() => {
    if (quillRef.current) {
      console.log('ReactQuill is mounted:', quillRef.current);
      const editor = quillRef.current.getEditor();
      if (editor) {
        console.log('Quill editor is available:', editor);
      }
    }
  }, [newTask.content]);

  // Quill modules configuration - wrapped in useMemo to prevent re-creation
  const quillModules = useMemo(() => ({
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
          const quill = (quillRef.current || quillEditRef.current)?.getEditor();
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
          
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
              setMessage({ type: 'error', text: 'Resim boyutu 5MB\'dan küçük olmalıdır' });
              return;
            }
            
            try {
              const reader = new FileReader();
              reader.onload = (e) => {
                const quill = (quillRef.current || quillEditRef.current)?.getEditor();
                if (!quill) return;
                const range = quill.getSelection(true);
                if (range) {
                  const imageUrl = e.target?.result;
                  // Store the range index and open dialog for size adjustment
                  setPendingImageIndex(range.index);
                  setImageDialog({ 
                    open: true, 
                    url: imageUrl, 
                    width: 400, 
                    height: 300 
                  });
                }
              };
              reader.readAsDataURL(file);
            } catch (error) {
              setMessage({ type: 'error', text: 'Resim yüklenemedi' });
            }
          };
        }
      }
    }
  }), [setMessage]);

  const quillFormats = useMemo(() => [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background', 'link', 'image'
  ], []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    // Strip HTML tags to check if content is empty
    const textContent = newTask.content.replace(/<[^>]*>/g, '').trim();
    if (!textContent) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await axios.post('/api/tasks', newTask);
      setNewTask({ content: '', priority: 'normal' });
      // Clear quill editor
      if (quillRef.current) {
        quillRef.current.getEditor().setContents([]);
      }
      await fetchTasks();
      setMessage({ type: 'success', text: 'Görev eklendi' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Görev eklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (task) => {
    setEditTaskId(task._id);
    setEditContent(task.content || '');
    setEditPriority(task.priority || 'normal');
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    const textContent = editContent.replace(/<[^>]*>/g, '').trim();
    if (!textContent) {
      setMessage({ type: 'error', text: 'Görev içeriği boş olamaz' });
      return;
    }

    try {
      setEditing(true);
      setMessage({ type: '', text: '' });
      await axios.patch(`/api/tasks/${editTaskId}`, {
        content: editContent,
        priority: editPriority,
      });
      
      await fetchTasks();
      setEditDialogOpen(false);
      setEditTaskId(null);
      setEditContent('');
      setEditPriority('normal');
      setMessage({ type: 'success', text: 'Görev güncellendi' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Görev güncellenirken bir hata oluştu' });
    } finally {
      setEditing(false);
    }
  };

  // @mention helper functions
  const getMentionSuggestions = (text, cursorPosition) => {
    const beforeCursor = text.substring(0, cursorPosition);
    const match = beforeCursor.match(/@(\w*)$/);
    if (!match) return [];
    const query = match[1].toLowerCase();
    
    // Group mentions
    const groupRoles = ['üye', 'ceza', 'admin'];
    const groupMatches = groupRoles.filter(role => role.startsWith(query));
    
    // Individual user mentions
    const userMatches = users.filter(u => 
      (u.username?.toLowerCase().includes(query) || 
       u.fullName?.toLowerCase().includes(query)) &&
      u._id !== user?.id
    ).slice(0, 5);
    
    // Combine group and user suggestions
    const suggestions = [];
    
    // Add group mentions first
    groupMatches.forEach(role => {
      suggestions.push({ 
        _id: `group_${role}`, 
        username: role, 
        fullName: `@${role} (Grup)`,
        isGroup: true,
        role 
      });
    });
    
    // Add user mentions
    suggestions.push(...userMatches);
    
    return suggestions.slice(0, 8);
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

  // Helper to get users mentioned for a specific mention text (e.g., "@ceza" or "@username")
  const getMentionedUsersForMention = (mentionText) => {
    if (!mentionText || !mentionText.startsWith('@')) return [];
    const mention = mentionText.substring(1).toLowerCase();
    const groupRoles = ['admin', 'ceza', 'uye'];
    const mentioned = [];
    
    // Check if it's a group mention
    if (groupRoles.includes(mention)) {
      const roleUsers = users.filter(u => u.role === mention);
      mentioned.push(...roleUsers.map(u => ({ ...u, isGroup: true, groupRole: mention })));
    } else {
      // Individual user mention
      const mentionedUser = users.find(u => u.username.toLowerCase() === mention);
      if (mentionedUser) {
        mentioned.push(mentionedUser);
      }
    }
    
    return mentioned;
  };

  // Helper to escape HTML to prevent XSS
  const escapeHtml = (text) => {
    if (!text || typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Helper to render HTML content with highlighted mentions (for rich text editor content)
  const renderHtmlWithMentions = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return '';
    
    // For now, just return the HTML content as-is
    // Mention highlighting in HTML would require more complex parsing
    // We'll keep it simple and let ReactQuill handle the formatting
    return htmlContent;
  };

  // Helper to render text with highlighted mentions (XSS-safe)
  const renderTextWithMentions = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    // Sanitize input - React will escape automatically, but we'll also sanitize manually
    const sanitizedText = text.replace(/[<>]/g, '');
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    const currentUsername = user?.username;

    while ((match = mentionRegex.exec(sanitizedText)) !== null) {
      if (!match || !match[0]) continue; // Safety check
      
      // Add text before mention (React automatically escapes HTML)
      if (match.index > lastIndex) {
        parts.push(sanitizedText.substring(lastIndex, match.index));
      }
      
      // Check if this mention is for current user
      const mentionedUsername = match[1];
      const mentionText = match[0]; // Store mention text to avoid closure issues
      const isMe = mentionedUsername?.toLowerCase() === currentUsername?.toLowerCase();
      const groupRoles = ['admin', 'ceza', 'uye'];
      const isGroup = groupRoles.includes(mentionedUsername?.toLowerCase() || '');
      
      // Get mentioned users for this specific mention
      const mentionedUsers = getMentionedUsersForMention(mentionText);
      
      // Add clickable mention link (React automatically escapes content)
      parts.push(
        <span
          key={match.index}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (mentionedUsers.length > 0) {
              setMentionDialog({
                open: true,
                mention: mentionText,
                mentionedUsers: mentionedUsers,
              });
            }
          }}
          style={{
            backgroundColor: isMe ? 'rgba(244, 67, 54, 0.2)' : 'rgba(33, 150, 243, 0.2)',
            padding: '2px 4px',
            borderRadius: '3px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
          title={`${mentionedUsers.length} kişi etiketlendi - Tıklayarak görüntüle`}
        >
          {mentionText}
        </span>
      );
      
      lastIndex = match.index + mentionText.length;
    }
    
    // Add remaining text (React automatically escapes)
    if (lastIndex < sanitizedText.length) {
      parts.push(sanitizedText.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : sanitizedText;
  };

  const handleComplete = async (taskId) => {
    setConfirm({ open: true, type: 'complete', taskId, commentId: null });
  };

  const confirmComplete = async () => {
    if (!confirm.taskId) return;
    try {
      await axios.patch(`/api/tasks/${confirm.taskId}/complete`);
      await fetchTasks();
      setConfirm({ open: false, type: '', taskId: null, commentId: null });
    } catch (error) {
      setMessage({ type: 'error', text: 'Görev tamamlanamadı' });
      setConfirm({ open: false, type: '', taskId: null, commentId: null });
    }
  };

  const handleUncomplete = async (taskId) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/uncomplete`);
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Görev geri alınamadı' });
    }
  };

  const handleAddComment = async (taskId) => {
    const messageText = commentInputs[taskId]?.trim();
    if (!messageText) return;
    try {
      await axios.post(`/api/tasks/${taskId}/comments`, { message: messageText });
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
    if (confirm.type === 'complete' && confirm.taskId) {
      await confirmComplete();
    } else if (confirm.type === 'task' && confirm.taskId) {
      await handleDeleteTask(confirm.taskId);
    } else if (confirm.type === 'comment' && confirm.taskId && confirm.commentId) {
      await handleDeleteComment(confirm.taskId, confirm.commentId);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Görev silinemedi' });
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}/comments/${commentId}`);
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

  const activeTasks = useMemo(() => {
    let filtered = tasks.filter((t) => !t.completed);
    
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // Check if it's a mention search (@username)
      if (query.startsWith('@')) {
        const mentionName = query.substring(1); // Remove @
        
        // Find user by username or fullName
        const matchedUser = users.find(u => 
          u.username?.toLowerCase() === mentionName ||
          u.fullName?.toLowerCase() === mentionName ||
          u.username?.toLowerCase().includes(mentionName) ||
          u.fullName?.toLowerCase().includes(mentionName)
        );
        
        if (matchedUser) {
          // Filter by author
          filtered = filtered.filter((t) => 
            t.author?._id === matchedUser._id || 
            t.author === matchedUser._id ||
            t.authorName?.toLowerCase() === matchedUser.fullName?.toLowerCase() ||
            t.authorName?.toLowerCase() === matchedUser.username?.toLowerCase()
          );
        } else {
          // No user found, filter by mention in content
          filtered = filtered.filter((t) => {
            const mentionRegex = new RegExp(`@${mentionName}`, 'i');
            return mentionRegex.test(t.content);
          });
        }
      } else {
        // Normal text search
        filtered = filtered.filter((t) => 
          t.content.toLowerCase().includes(query) ||
          t.authorName?.toLowerCase().includes(query)
        );
      }
    }
    
    return sortTasks(filtered);
  }, [tasks, searchQuery, users]);

  const completedTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.completed);
    
    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // Check if it's a mention search (@username)
      if (query.startsWith('@')) {
        const mentionName = query.substring(1); // Remove @
        
        // Find user by username or fullName
        const matchedUser = users.find(u => 
          u.username?.toLowerCase() === mentionName ||
          u.fullName?.toLowerCase() === mentionName ||
          u.username?.toLowerCase().includes(mentionName) ||
          u.fullName?.toLowerCase().includes(mentionName)
        );
        
        if (matchedUser) {
          // Filter by author
          filtered = filtered.filter((t) => 
            t.author?._id === matchedUser._id || 
            t.author === matchedUser._id ||
            t.authorName?.toLowerCase() === matchedUser.fullName?.toLowerCase() ||
            t.authorName?.toLowerCase() === matchedUser.username?.toLowerCase()
          );
        } else {
          // No user found, filter by mention in content
          filtered = filtered.filter((t) => {
            const mentionRegex = new RegExp(`@${mentionName}`, 'i');
            return mentionRegex.test(t.content);
          });
        }
      } else {
        // Normal text search
        filtered = filtered.filter((t) => 
          t.content.toLowerCase().includes(query) ||
          t.authorName?.toLowerCase().includes(query)
        );
      }
    }
    
    return sortTasks(filtered);
  }, [tasks, searchQuery, users]);

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 2, display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  // Block access for 'uye' role
  if (user.role === 'uye') {
    return (
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 1, sm: 2 }, px: { xs: 1, sm: 2, md: 3 }, py: { xs: 1, sm: 2 } }}>
      <Paper 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: { xs: 2, sm: 3 }, 
          width: '100%',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2 }}>
          Görev Oluştur
        </Typography>
        <form onSubmit={handleAddTask}>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 500 }}>
                Görev açıklaması
              </Typography>
              <Box 
                id="task-quill-editor"
                sx={{ 
                  mb: 0,
                  position: 'relative',
                  width: '100%',
                  minHeight: '280px',
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  '& .quill': {
                    width: '100% !important',
                    display: 'flex !important',
                    flexDirection: 'column !important',
                    minHeight: '280px !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    position: 'relative !important',
                    zIndex: 1,
                  },
                  '& .ql-toolbar': {
                    borderRadius: '6px 6px 0 0 !important',
                    border: 'none !important',
                    borderBottom: '1px solid !important',
                    borderColor: 'divider !important',
                    bgcolor: 'background.default !important',
                    display: 'flex !important',
                    flexWrap: 'wrap !important',
                    position: 'relative !important',
                    zIndex: 2,
                    width: '100% !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    padding: '10px 12px !important',
                    minHeight: '42px !important',
                    '& .ql-picker-label': {
                      color: 'text.primary !important',
                    },
                    '& .ql-stroke': {
                      stroke: 'text.primary !important',
                      strokeWidth: '1.5 !important',
                    },
                    '& .ql-fill': {
                      fill: 'text.primary !important',
                    },
                    '& button': {
                      color: 'text.primary !important',
                      '&:hover': {
                        bgcolor: 'action.hover !important',
                      },
                    },
                  },
                  '& .ql-container': {
                    border: 'none !important',
                    borderRadius: '0 0 6px 6px !important',
                    bgcolor: 'background.paper !important',
                    minHeight: '238px !important',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    position: 'relative !important',
                    zIndex: 1,
                    width: '100% !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    flex: 1,
                  },
                  '& .ql-editor': {
                    minHeight: '238px !important',
                    color: 'text.primary !important',
                    position: 'relative !important',
                    zIndex: 1,
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    padding: '16px !important',
                    lineHeight: 1.6,
                    '&.ql-blank::before': {
                      fontStyle: 'normal',
                      color: 'text.secondary',
                      opacity: 0.7,
                      left: '16px !important',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: 1,
                      my: 1,
                    },
                    '& p': {
                      margin: '0.5em 0',
                    },
                    '& ul, & ol': {
                      marginLeft: '1.5em',
                    },
                    '& strong': {
                      fontWeight: 'bold',
                    },
                    '& em': {
                      fontStyle: 'italic',
                    },
                  },
                }}
              >
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={newTask.content || ''}
                  onChange={(content) => {
                    setNewTask((prev) => ({ ...prev, content }));
                  }}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Görev açıklaması girin... (Kalınlaştırma, resim ekleme gibi özellikleri kullanabilirsiniz)"
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '280px' }}
                />
              </Box>
            </Box>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
              <TextField
                select
                label="Öncelik"
                value={newTask.priority}
                onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
                SelectProps={{ native: true }}
                sx={{ minWidth: { xs: '100%', md: 160 }, width: { xs: '100%', md: 'auto' } }}
              >
                <option value="critical">Kritik</option>
                <option value="medium">Orta</option>
                <option value="normal">Normal</option>
              </TextField>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || !newTask.content.replace(/<[^>]*>/g, '').trim()} 
                sx={{ minWidth: { xs: '100%', md: 120 }, width: { xs: '100%', md: 'auto' } }}
              >
                {loading ? 'Ekleniyor...' : 'Görev Ekle'}
              </Button>
            </Stack>
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
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Görevler
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Aktif: {activeTasks.length} • Tamamlanan: {completedTasks.length}
            </Typography>
          </Box>
          <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ mt: { xs: 1, sm: 0 } }}>
            <Tab label="Aktif Görevler" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 80, sm: 120 }, px: { xs: 1, sm: 2 } }} />
            <Tab label="Tamamlanan Görevler" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 80, sm: 120 }, px: { xs: 1, sm: 2 } }} />
          </Tabs>
        </Box>

        <Divider sx={{ mt: { xs: 1, sm: 1 } }} />

        {/* Search Bar */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, position: 'relative' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} alignItems="center">
            <Box sx={{ position: 'relative', flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Görev içeriğinde ara veya @kullanıcı ile kullanıcı görevlerini filtrele..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  // Check for @mention
                  const cursorPos = e.target.selectionStart || value.length;
                  const suggestions = getMentionSuggestions(value, cursorPos);
                  if (suggestions.length > 0) {
                    setSearchMentionOpen(true);
                    setSearchMentionPosition(cursorPos);
                  } else {
                    setSearchMentionOpen(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (searchMentionOpen && e.key === 'Enter' && !e.shiftKey) {
                    const suggestions = getMentionSuggestions(searchQuery, searchMentionPosition);
                    if (suggestions.length > 0 && !e.ctrlKey) {
                      e.preventDefault();
                      const mentionText = suggestions[0].isGroup ? suggestions[0].role : suggestions[0].username;
                      setSearchQuery(`@${mentionText}`);
                      setSearchMentionOpen(false);
                    }
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setSearchMentionOpen(false), 200);
                }}
              />
              {searchMentionOpen && (
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
                    borderRadius: '12px',
                  }}
                >
                  <List dense>
                    {getMentionSuggestions(searchQuery, searchMentionPosition).map((u) => (
                      <ListItem
                        key={u._id || u.username}
                        button
                        onClick={() => {
                          const mentionText = u.isGroup ? u.role : u.username;
                          setSearchQuery(`@${mentionText}`);
                          setSearchMentionOpen(false);
                        }}
                        sx={{
                          borderRadius: '8px',
                          mx: 0.5,
                          my: 0.5,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar 
                            src={u.isGroup ? undefined : u.profileImage} 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: u.isGroup ? 'secondary.main' : undefined
                            }}
                          >
                            {u.isGroup ? 'G' : (u.fullName?.[0] || u.username?.[0])}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={u.isGroup ? `@${u.role} (Grup)` : (u.fullName || u.username)}
                          secondary={u.isGroup ? `${u.role} rolündeki herkesi etiketle` : `@${u.username}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
            {searchQuery && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setSearchMentionOpen(false);
                }}
                fullWidth={{ xs: true, sm: false }}
              >
                Temizle
            </Button>
            )}
          </Stack>
        </Box>

        <Divider />

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {(tab === 0 ? activeTasks : completedTasks).map((task) => {
                return (
                <Paper 
                  key={task._id} 
                  variant="outlined" 
                  sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    mb: { xs: 1.5, sm: 2 }, 
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }} spacing={{ xs: 1, sm: 2 }}>
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1 }} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1, flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 } }}>
                    <Avatar 
                      sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }} 
                      src={
                        task.authorImage 
                          ? (task.authorImage.startsWith('http') || task.authorImage.startsWith('data:'))
                            ? task.authorImage
                            : `${axios.defaults.baseURL || window.location.origin}${task.authorImage.startsWith('/') ? '' : '/'}${task.authorImage}`
                          : undefined
                      }
                    >
                      {task.authorName?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="bold" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{task.authorName || 'Bilinmiyor'}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, display: 'block' }}>
                        {dayjs(task.createdAt).format('DD.MM.YYYY HH:mm')} ({dayjs(task.createdAt).fromNow()})
                      </Typography>
                    </Box>
                    <Chip
                      label={priorityLabel[task.priority] || 'Normal'}
                      color={priorityColor[task.priority]}
                      size="small"
                      sx={{ ml: { xs: 0, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                    />
                  </Stack>
                  <Box 
                    sx={{ 
                      mb: 1, 
                      fontSize: { xs: '0.875rem', sm: '1rem' }, 
                      wordBreak: 'break-word',
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
                      '& strong': {
                        fontWeight: 'bold',
                      },
                      '& em': {
                        fontStyle: 'italic',
                      },
                      '& a': {
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      },
                      '& span[style*="background-color"]': {
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      },
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: task.content || ''
                    }}
                  />
                  {task.completed && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1 }} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1, flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 } }}>
                      <CheckCircle color="success" sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      <Avatar sx={{ width: { xs: 24, sm: 28 }, height: { xs: 24, sm: 28 } }} src={task.completedByImage || undefined}>
                        {task.completedByName?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {task.completedByName || 'Bilinmiyor'} tarafından {dayjs(task.completedAt).format('DD.MM.YYYY HH:mm')} tarihinde tamamlandı
                      </Typography>
                    </Stack>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, gap: { xs: 1, sm: 1 }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                  {task.completed ? (
                    <Stack direction={{ xs: 'row', sm: 'row' }} spacing={{ xs: 0.5, sm: 1 }} alignItems="center" sx={{ flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 } }}>
                      <Button variant="outlined" size="small" onClick={() => handleUncomplete(task._id)} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: { xs: 'auto', sm: 80 } }}>
                        Geri Al
                      </Button>
                      <Tooltip title="Görev detayını yeni sekmede aç">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            window.open(`/dashboard/tasks/${task._id}`, '_blank');
                          }}
                        >
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(user?.role === 'admin' || task.author === user?.id || task.author?._id === user?.id) && (
                        <>
                          <Tooltip title="Görevi Düzenle">
                            <IconButton color="primary" size="small" onClick={() => handleEditClick(task)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        <Tooltip title="Görevi Sil">
                          <IconButton color="error" size="small" onClick={() => askDeleteTask(task._id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        </>
                      )}
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: { xs: 0.5, sm: 1 } }}>
                      <Button variant="contained" size="small" onClick={() => handleComplete(task._id)}>
                        Görevi Bitir
                      </Button>
                      <Tooltip title="Görev detayını yeni sekmede aç">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            window.open(`/dashboard/tasks/${task._id}`, '_blank');
                          }}
                        >
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(user?.role === 'admin' || task.author === user?.id || task.author?._id === user?.id) && (
                        <>
                          <Tooltip title="Görevi Düzenle">
                            <IconButton color="primary" size="small" onClick={() => handleEditClick(task)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Görevi Sil">
                            <IconButton color="error" size="small" onClick={() => askDeleteTask(task._id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
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
                {visibleComments(task).map((comment, idx) => {
                  return (
                  <Box 
                    key={comment._id || idx} 
                    sx={{ 
                      p: 1.2, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar 
                        sx={{ width: 28, height: 28 }} 
                        src={
                          comment.authorImage 
                            ? (comment.authorImage.startsWith('http') || comment.authorImage.startsWith('data:'))
                              ? comment.authorImage
                              : `${axios.defaults.baseURL || window.location.origin}${comment.authorImage.startsWith('/') ? '' : '/'}${comment.authorImage}`
                            : undefined
                        }
                      >
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
                      {renderTextWithMentions(comment.message)}
                    </Typography>
                  </Box>
                  );
                })}
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
                            key={u._id || u.username}
                            button
                            onClick={() => {
                              const currentComment = commentInputs[task._id] || '';
                              const mentionText = u.isGroup ? u.role : u.username;
                              const newComment = insertMention(currentComment, mentionOpen.position, mentionText);
                              setCommentInputs((prev) => ({ ...prev, [task._id]: newComment }));
                              setMentionOpen({ taskId: null, position: null });
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                src={u.isGroup ? undefined : u.profileImage} 
                                sx={{ 
                                  width: 24, 
                                  height: 24,
                                  bgcolor: u.isGroup ? 'secondary.main' : undefined
                                }}
                              >
                                {u.isGroup ? 'G' : (u.fullName?.[0] || u.username?.[0])}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={u.isGroup ? `@${u.role} (Grup)` : (u.fullName || u.username)}
                              secondary={u.isGroup ? `${u.role} rolündeki herkesi etiketle` : `@${u.username}`}
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
                );
              })}

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
            {confirm.type === 'complete'
              ? 'Görevi bitirmek istediğinize emin misiniz?'
              : confirm.type === 'task'
              ? 'Görevi silmek istediğinize emin misiniz?'
              : 'Yorumu silmek istediğinize emin misiniz?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, type: '', taskId: null, commentId: null })}>Vazgeç</Button>
          <Button 
            color={confirm.type === 'complete' ? 'primary' : 'error'} 
            variant="contained"
            onClick={handleConfirm}
          >
            {confirm.type === 'complete' ? 'Evet, Bitir' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mention Dialog - Show who was mentioned */}
      <Dialog 
        open={mentionDialog.open} 
        onClose={() => setMentionDialog({ open: false, mention: '', mentionedUsers: [] })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" component="span">
              Etiketlenen Kullanıcılar
            </Typography>
            <Chip 
              label={mentionDialog.mention} 
              size="small" 
              color="primary"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {mentionDialog.mentionedUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Bu etiket için kullanıcı bulunamadı.
            </Typography>
          ) : (
            <List>
              {mentionDialog.mentionedUsers.map((mentionedUser, index) => (
                <Box key={mentionedUser._id || mentionedUser.id || mentionedUser.username || index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={mentionedUser.profileImage} sx={{ bgcolor: 'primary.main' }}>
                        {mentionedUser.fullName?.[0]?.toUpperCase() || mentionedUser.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography component="span" variant="body1" fontWeight="medium">
                            {mentionedUser.fullName || mentionedUser.username}
                          </Typography>
                          {mentionedUser.isGroup && (
                            <Chip 
                              component="span"
                              label={`@${mentionedUser.groupRole} (Grup)`} 
                              size="small" 
                              color="secondary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          <Typography component="span" variant="caption" color="text.secondary">
                            @{mentionedUser.username}
                          </Typography>
                          {mentionedUser.role && (
                            <Chip
                              component="span"
                              label={mentionedUser.role === 'admin' ? 'Admin' : mentionedUser.role === 'ceza' ? 'Ceza' : 'Üye'}
                              size="small"
                              color={mentionedUser.role === 'admin' ? 'primary' : mentionedUser.role === 'ceza' ? 'warning' : 'default'}
                            />
                          )}
                          {mentionedUser.isCurrentlyActive && (
                            <Chip
                              component="span"
                              label="Aktif"
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < mentionDialog.mentionedUsers.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMentionDialog({ open: false, mention: '', mentionedUsers: [] })}>
            Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => !editing && setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Görevi Düzenle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Görev açıklaması
              </Typography>
              <Box sx={{ 
                '& .ql-container': {
                  minHeight: '200px',
                  bgcolor: 'background.paper',
                },
                '& .ql-toolbar': {
                  borderRadius: '4px 4px 0 0',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '& .ql-picker-label': {
                    color: 'text.primary',
                  },
                  '& .ql-stroke': {
                    stroke: 'text.primary',
                  },
                  '& .ql-fill': {
                    fill: 'text.primary',
                  },
                },
                '& .ql-container.ql-snow': {
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '0 0 4px 4px',
                  bgcolor: 'background.paper',
                },
                '& .ql-editor': {
                  minHeight: '200px',
                  color: 'text.primary',
                  '&.ql-blank::before': {
                    fontStyle: 'normal',
                    color: 'text.secondary',
                    opacity: 0.6,
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
                  ref={quillEditRef}
                  theme="snow"
                  value={editContent}
                  onChange={setEditContent}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Görev açıklaması girin..."
                />
              </Box>
            </Box>
            <FormControl fullWidth>
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

      {/* Image Size Dialog */}
      <Dialog 
        open={imageDialog.open} 
        onClose={() => {
          setImageDialog({ open: false, url: '', width: 400, height: 300 });
          setPendingImageIndex(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resim Boyutunu Ayarla</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, minHeight: '300px', position: 'relative' }}>
              <ResizableBox
                width={imageDialog.width}
                height={imageDialog.height}
                minConstraints={[100, 100]}
                maxConstraints={[800, 600]}
                onResize={(e, data) => {
                  setImageDialog(prev => ({
                    ...prev,
                    width: data.size.width,
                    height: data.size.height
                  }));
                }}
                resizeHandles={['se']}
                style={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                }}
              >
                <img 
                  src={imageDialog.url} 
                  alt="Preview" 
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'block'
                  }} 
                />
              </ResizableBox>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Köşeden tutup çekerek boyutu ayarlayın
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImageDialog({ open: false, url: '', width: 400, height: 300 });
            setPendingImageIndex(null);
          }}>
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              const quill = (quillRef.current || quillEditRef.current)?.getEditor();
              if (quill && pendingImageIndex !== null) {
                try {
                  // Get current selection and insert newline before if needed
                  const beforeText = quill.getText(0, pendingImageIndex);
                  let insertIndex = pendingImageIndex;
                  if (beforeText && beforeText.trim() && !beforeText.endsWith('\n')) {
                    quill.insertText(pendingImageIndex, '\n', 'user');
                    insertIndex = pendingImageIndex + 1;
                  }
                  
                  // Set selection
                  quill.setSelection(insertIndex, 'user');
                  
                  // Insert image using insertEmbed (Quill's standard method)
                  quill.insertEmbed(insertIndex, 'image', imageDialog.url, 'user');
                  
                  // Add newline after image
                  quill.insertText(insertIndex + 1, '\n', 'user');
                  
                  // Update image style and sync content after a short delay
                  setTimeout(() => {
                    const imgs = quill.root.querySelectorAll('img');
                    const img = Array.from(imgs).find(img => img.src === imageDialog.url);
                    
                    if (img) {
                      // Apply inline styles directly
                      const widthPercent = Math.round((imageDialog.width / 800) * 100);
                      img.style.cssText = `display: block !important; width: ${widthPercent}% !important; height: ${imageDialog.height}px !important; margin: 16px auto !important; border-radius: 8px !important; max-width: 100% !important;`;
                      
                      // Ensure image is in a paragraph tag
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
                      
                      // Trigger Quill update to sync internal state
                      quill.update('user');
                      
                      // Get the updated HTML content and update React state immediately
                      // This ensures the image is saved in the task content
                      const updatedHTML = quill.root.innerHTML;
                      
                      if (quillRef.current) {
                        setNewTask((prev) => ({ ...prev, content: updatedHTML }));
                      } else if (quillEditRef.current) {
                        setEditContent(updatedHTML);
                      }
                      
                      // Set cursor after image
                      const newLength = quill.getLength();
                      quill.setSelection(Math.min(insertIndex + 2, newLength), 'user');
                    }
                  }, 200);
                } catch (error) {
                  console.error('Error inserting image:', error);
                  setMessage({ type: 'error', text: 'Resim eklenirken bir hata oluştu' });
                }
              }
              setImageDialog({ open: false, url: '', width: 400, height: 300 });
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

export default TasksBoard;

