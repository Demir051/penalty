import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  Home,
  Assignment,
  Email,
  Support,
  Receipt,
  ListAlt,
  DarkMode,
  LightMode,
  AdminPanelSettings,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from '../components/NotificationPanel';
import axios from 'axios';

const drawerWidth = 240;

const Dashboard = ({ themeMode = 'light', onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get menu items based on role
  const getMenuItems = () => {
    if (!user) return [];
    
    const baseItems = [];
    
    // Üye: Only Beyanmatik and Dekont Atıcı
    if (user.role === 'uye') {
      baseItems.push(
        { text: 'Beyanmatik', icon: <Assignment />, path: '/dashboard/beyanmatik' },
        { text: 'Dekont Atıcı', icon: <Receipt />, path: '/dashboard/dekont-atici' }
      );
    }
    // Ceza: Dashboard, Beyanmatik, Mail pages, Dekont Atıcı, Tasks (no logs)
    else if (user.role === 'ceza') {
      baseItems.push(
        { text: 'Main Page', icon: <Home />, path: '/dashboard' },
        { text: 'Beyanmatik', icon: <Assignment />, path: '/dashboard/beyanmatik' },
        { text: 'Mailmatik', icon: <Email />, path: '/dashboard/mailmatik' },
        { text: 'Destek Mailmatik', icon: <Support />, path: '/dashboard/destek-mailmatik' },
        { text: 'Dekont Atıcı', icon: <Receipt />, path: '/dashboard/dekont-atici' },
        { text: 'Görevler', icon: <ListAlt />, path: '/dashboard/tasks' }
      );
    }
    // Admin: Everything
    else if (user.role === 'admin') {
      baseItems.push(
        { text: 'Main Page', icon: <Home />, path: '/dashboard' },
        { text: 'Beyanmatik', icon: <Assignment />, path: '/dashboard/beyanmatik' },
        { text: 'Mailmatik', icon: <Email />, path: '/dashboard/mailmatik' },
        { text: 'Destek Mailmatik', icon: <Support />, path: '/dashboard/destek-mailmatik' },
        { text: 'Dekont Atıcı', icon: <Receipt />, path: '/dashboard/dekont-atici' },
        { text: 'Görevler', icon: <ListAlt />, path: '/dashboard/tasks' },
        { text: 'Loglar', icon: <AdminPanelSettings />, path: '/dashboard/logs' }
      );
    }
    
    return baseItems;
  };

  const menuItems = getMenuItems();

  // Ping server for activity tracking
  useEffect(() => {
    if (user) {
      const pingInterval = setInterval(() => {
        axios.post('/api/users/me/ping').catch(() => {});
      }, 30000); // Every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [user]);

  // Fetch unread notification count
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const response = await axios.get('/api/notifications/unread-count');
          setUnreadCount(response.data.count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };

      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000); // Every 10 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const goAccountSettings = () => {
    navigate('/dashboard/account-settings');
    handleMenuClose();
  };

  const goAddUser = () => {
    navigate('/dashboard/users/new');
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Penalty Dashboard
          </Typography>
          {user && (
            <>
              <IconButton color="inherit" onClick={onToggleTheme} sx={{ mr: 1 }}>
                {themeMode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
              <IconButton
                color="inherit"
                onClick={() => setNotificationOpen(true)}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Avatar
                  sx={{ width: 32, height: 32 }}
                  src={user.profileImage || undefined}
                >
                  {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="body2">
                  {user.fullName || user.username}
                </Typography>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={goAccountSettings}>Hesap Ayarları</MenuItem>
                {user.role === 'admin' && (
                  <MenuItem onClick={goAddUser}>Yeni Kullanıcı Ekle</MenuItem>
                )}
                <Divider />
                <MenuItem onClick={() => { handleMenuClose(); logout(); }}>Çıkış Yap</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      <NotificationPanel
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </Box>
  );
};

export default Dashboard;
