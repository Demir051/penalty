import React from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const baseMenuItems = [
  { text: 'Main Page', icon: <Home />, path: '/dashboard' },
  { text: 'Beyanmatik', icon: <Assignment />, path: '/dashboard/beyanmatik' },
  { text: 'Mailmatik', icon: <Email />, path: '/dashboard/mailmatik' },
  {
    text: 'Destek Mailmatik',
    icon: <Support />,
    path: '/dashboard/destek-mailmatik',
  },
  {
    text: 'Dekont Atıcı',
    icon: <Receipt />,
    path: '/dashboard/dekont-atici',
  },
  {
    text: 'Görevler',
    icon: <ListAlt />,
    path: '/dashboard/tasks',
  },
];

const Dashboard = ({ themeMode = 'light', onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuItems = React.useMemo(() => {
    if (!user) return baseMenuItems;
    if (user.role === 'admin') {
      return [
        ...baseMenuItems,
        { text: 'Loglar', icon: <AdminPanelSettings />, path: '/dashboard/logs' },
      ];
    }
    return baseMenuItems;
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
              <IconButton color="inherit" onClick={handleMenuOpen} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                <MenuItem onClick={goAddUser}>Yeni Kullanıcı Ekle</MenuItem>
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
    </Box>
  );
};

export default Dashboard;


