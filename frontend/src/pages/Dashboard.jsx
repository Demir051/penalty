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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import {
  Home,
  Assignment,
  Email,
  ListAlt,
  DarkMode,
  LightMode,
  AdminPanelSettings,
  Notifications as NotificationsIcon,
  People,
  Today,
  Receipt,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get menu items based on role
  const getMenuItems = () => {
    if (!user) return [];
    
    const baseItems = [];
    
    // Üye: Only Beyanmatik
    if (user.role === 'uye') {
      baseItems.push(
        { text: 'Beyanmatik', icon: <Assignment />, path: '/dashboard/beyanmatik' }
      );
    }
    // Ceza: Dashboard, Beyanmatik, Mailmatik, Tasks, Daily Tracking, Receipt Tracking (no logs)
    else if (user.role === 'ceza') {
      baseItems.push(
        { text: 'Main Page', icon: <Home />, path: '/dashboard' },
        { text: 'Beyanmatik', icon: <Assignment />, path: '/dashboard/beyanmatik' },
        { text: 'Mailmatik', icon: <Email />, path: '/dashboard/mailmatik' },
        { text: 'Görevler', icon: <ListAlt />, path: '/dashboard/tasks' },
        { text: 'Günlük Takım Takibi', icon: <Today />, path: '/dashboard/daily-tracking' },
        { text: 'Makbuz Takip', icon: <Receipt />, path: '/dashboard/receipt-tracking' }
      );
    }
    // Admin: Everything
    else if (user.role === 'admin') {
      baseItems.push(
        { text: 'Main Page', icon: <Home />, path: '/dashboard' },
        { text: 'Beyanmatik', icon: <Assignment />, path: '/dashboard/beyanmatik' },
        { text: 'Mailmatik', icon: <Email />, path: '/dashboard/mailmatik' },
        { text: 'Görevler', icon: <ListAlt />, path: '/dashboard/tasks' },
        { text: 'Günlük Takım Takibi', icon: <Today />, path: '/dashboard/daily-tracking' },
        { text: 'Makbuz Takip', icon: <Receipt />, path: '/dashboard/receipt-tracking' },
        { text: 'Kullanıcı Yönetimi', icon: <People />, path: '/dashboard/users' },
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
          // Silently fail - notifications are not critical
          if (import.meta.env.DEV) {
            console.error('Error fetching unread count:', error);
          }
        }
      };

      fetchUnreadCount();
      // Optimize polling: increase interval and pause when tab is hidden
      let interval;
      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (interval) clearInterval(interval);
        } else {
          if (interval) clearInterval(interval);
          interval = setInterval(fetchUnreadCount, 15000); // 15 seconds
        }
      };
      
      interval = setInterval(fetchUnreadCount, 15000);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Penalty Dashboard
          </Typography>
          {user && (
            <>
              <IconButton color="inherit" onClick={onToggleTheme} sx={{ mr: { xs: 0.5, sm: 1 }, p: { xs: 0.75, sm: 1 } }}>
                {themeMode === 'light' ? <DarkMode sx={{ fontSize: { xs: 20, sm: 24 } }} /> : <LightMode sx={{ fontSize: { xs: 20, sm: 24 } }} />}
              </IconButton>
              <IconButton
                color="inherit"
                onClick={() => setNotificationOpen(true)}
                sx={{ mr: { xs: 0.5, sm: 1 }, p: { xs: 0.75, sm: 1 } }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Badge>
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, p: { xs: 0.5, sm: 1 } }}
              >
                <Avatar
                  sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 } }}
                  src={
                    user.profileImage
                      ? user.profileImage.startsWith('http://') || user.profileImage.startsWith('https://')
                        ? user.profileImage
                        : user.profileImage.startsWith('data:')
                        ? user.profileImage
                        : `${axios.defaults.baseURL || window.location.origin}${user.profileImage.startsWith('/') ? '' : '/'}${user.profileImage}`
                      : undefined
                  }
                >
                  {user.fullName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                </Avatar>
                {!isMobile && (
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {user.fullName || user.username}
                  </Typography>
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={goAccountSettings} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Hesap Ayarları</MenuItem>
                {user.role === 'admin' && (
                  <MenuItem onClick={goAddUser} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Yeni Kullanıcı Ekle</MenuItem>
                )}
                <Divider />
                <MenuItem onClick={() => { handleMenuClose(); logout(); }} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Çıkış Yap</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRadius: { xs: 0, md: '0 20px 20px 0' },
            borderRight: { xs: 'none', md: '1px solid' },
            borderColor: { md: 'divider' },
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List sx={{ px: { xs: 1, sm: 2 } }}>
            {menuItems.map((item) => {
              // Mailmatik için nested route kontrolü yap
              const isSelected = item.path === '/dashboard/mailmatik' 
                ? location.pathname.startsWith('/dashboard/mailmatik')
                : location.pathname === item.path;
              
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      py: { xs: 1, sm: 1.5 },
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 }, color: 'inherit' }}>{item.icon}</ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        fontWeight: isSelected ? 600 : 400,
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
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
