import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect, useMemo, useState } from 'react';
import Dashboard from './pages/Dashboard';
import MainPage from './pages/MainPage';
import Beyanmatik from './pages/Beyanmatik';
import Mailmatik from './pages/Mailmatik';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import AccountSettings from './pages/AccountSettings';
import AddUser from './pages/AddUser';
import TasksBoard from './pages/TasksBoard';
import TaskDetail from './pages/TaskDetail';
import AdminLogs from './pages/AdminLogs';
import UserManagement from './pages/UserManagement';
import DailyTeamTracking from './pages/DailyTeamTracking';

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const theme = useMemo(() => {
    const isLight = mode === 'light';
    return createTheme({
      palette: {
        mode,
        primary: { main: isLight ? '#6366f1' : '#818cf8' },
        secondary: { main: isLight ? '#ec4899' : '#f472b6' },
        background: isLight
          ? { default: '#f1f5f9', paper: '#ffffff' }
          : { default: '#1e293b', paper: '#0f172a' },
        text: isLight
          ? { primary: '#0f172a', secondary: '#475569' }
          : { primary: '#f1f5f9', secondary: '#cbd5e1' },
        divider: isLight ? '#e2e8f0' : '#334155',
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: isLight ? '#f8fafc' : '#1e293b',
              color: isLight ? '#1e293b' : '#f1f5f9',
              // Modern scrollbar
              '&::-webkit-scrollbar': {
                width: '12px',
                height: '12px',
              },
              '&::-webkit-scrollbar-track': {
                background: isLight ? '#f1f5f9' : '#0f172a',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: isLight ? '#cbd5e1' : '#475569',
                borderRadius: '10px',
                border: isLight ? '2px solid #f1f5f9' : '2px solid #0f172a',
                '&:hover': {
                  background: isLight ? '#94a3b8' : '#64748b',
                },
              },
            },
            '*': {
              // Firefox scrollbar
              scrollbarWidth: 'thin',
              scrollbarColor: isLight ? '#cbd5e1 #f1f5f9' : '#475569 #0f172a',
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: '16px',
              boxShadow: isLight
                ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 500,
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: '16px',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: '10px',
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              margin: '4px 8px',
              '&.Mui-selected': {
                borderRadius: '12px',
              },
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              borderRadius: '12px 12px 0 0',
              textTransform: 'none',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: '16px',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRadius: '0 16px 16px 0',
            },
          },
        },
      },
      shape: {
        borderRadius: 12,
      },
    });
  }, [mode]);

  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard themeMode={mode} onToggleTheme={toggleMode} />
            </PrivateRoute>
          }
        >
          <Route index element={<MainPage />} />
          <Route path="beyanmatik" element={<Beyanmatik />} />
          <Route path="mailmatik/*" element={<Mailmatik />} />
          <Route path="account-settings" element={<AccountSettings />} />
          <Route path="users/new" element={<AddUser />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="tasks" element={<TasksBoard />} />
          <Route path="tasks/:taskId" element={<TaskDetail />} />
          <Route path="daily-tracking" element={<DailyTeamTracking />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

