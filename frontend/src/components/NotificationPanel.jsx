import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Badge,
  Button,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
  Notifications,
  Close,
  CheckCircle,
} from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/tr';

dayjs.extend(relativeTime);
dayjs.locale('tr');

const NotificationPanel = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching unread count:', error);
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error marking all as read:', error);
      }
    }
  };

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 420,
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">Bildirimler</Typography>
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
          {unreadCount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                size="small" 
                variant="outlined"
                onClick={markAllAsRead}
                startIcon={<CheckCircle />}
                sx={{ 
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Tümünü Okundu İşaretle ({unreadCount})
              </Button>
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Yükleniyor...
              </Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
              <Typography variant="body1" color="text.secondary" fontWeight="medium">
                Bildirim yok
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Yeni bildirimler burada görünecek
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => {
                // Determine background color based on notification type
                let bgColor = notification.read ? 'transparent' : 'action.selected';
                
                if (!notification.read) {
                  if (notification.type === 'mention') {
                    // Mention: different color if it's me being mentioned
                    if (notification.fromUser?._id === user?.id || notification.fromUser === user?.id) {
                      // I mentioned someone else - blue tint
                      bgColor = 'rgba(33, 150, 243, 0.08)';
                    } else {
                      // Someone mentioned me - red tint
                      bgColor = 'rgba(244, 67, 54, 0.08)';
                    }
                  } else if (notification.type === 'task_comment') {
                    // Comment: different color (green tint)
                    bgColor = 'rgba(76, 175, 80, 0.08)';
                  }
                }
                
                return (
                  <ListItem
                    key={notification._id}
                    sx={{
                      bgcolor: bgColor,
                      borderRadius: 2,
                      mb: 1,
                      cursor: 'pointer',
                      border: !notification.read ? '1px solid' : '1px solid transparent',
                      borderColor: !notification.read 
                        ? (notification.type === 'mention' 
                          ? (notification.fromUser?._id === user?.id || notification.fromUser === user?.id 
                            ? 'primary.main' 
                            : 'error.main')
                          : notification.type === 'task_comment' 
                            ? 'success.main' 
                            : 'primary.main')
                        : 'transparent',
                      '&:hover': {
                        bgcolor: notification.read ? 'action.hover' : bgColor,
                      },
                      transition: 'all 0.2s',
                    }}
                    onClick={() => !notification.read && markAsRead(notification._id)}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={notification.fromUserProfileImage || notification.fromUser?.profileImage}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: !notification.read ? '2px solid' : 'none',
                          borderColor: notification.type === 'mention'
                            ? (notification.fromUser?._id === user?.id || notification.fromUser === user?.id
                              ? 'primary.main'
                              : 'error.main')
                            : 'success.main',
                        }}
                      >
                        {notification.fromUserName?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <>
                          <Typography component="span" variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip 
                              label="Yeni" 
                              size="small" 
                              color="primary"
                              sx={{ height: 20, fontSize: '0.7rem', mr: 0.5 }}
                            />
                          )}
                          {notification.isGroupMention && (
                            <Chip 
                              label={`@${notification.groupRole}`} 
                              size="small" 
                              color="secondary"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography component="span" variant="caption" color="text.secondary">
                            {dayjs(notification.createdAt).format('DD.MM.YYYY HH:mm')} • {dayjs(notification.createdAt).fromNow()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;

