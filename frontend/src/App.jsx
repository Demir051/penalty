import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useEffect, useMemo, useState } from 'react';
import Dashboard from './pages/Dashboard';
import MainPage from './pages/MainPage';
import Beyanmatik from './pages/Beyanmatik';
import Mailmatik from './pages/Mailmatik';
import DestekMailmatik from './pages/DestekMailmatik';
import DekontAtıcı from './pages/DekontAtıcı';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import AccountSettings from './pages/AccountSettings';
import AddUser from './pages/AddUser';
import TasksBoard from './pages/TasksBoard';
import AdminLogs from './pages/AdminLogs';
import UserManagement from './pages/UserManagement';

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
        primary: { main: isLight ? '#2563eb' : '#60a5fa' },
        secondary: { main: isLight ? '#dc004e' : '#f472b6' },
        background: isLight
          ? { default: '#f0f2f5', paper: '#ffffff' }
          : { default: '#0f172a', paper: '#111827' },
        text: isLight
          ? { primary: '#0f172a', secondary: '#475569' }
          : { primary: '#e5e7eb', secondary: '#94a3b8' },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: isLight ? '#f0f2f5' : '#0f172a',
              color: isLight ? '#0f172a' : '#e5e7eb',
            },
          },
        },
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
          <Route path="mailmatik" element={<Mailmatik />} />
          <Route path="destek-mailmatik" element={<DestekMailmatik />} />
          <Route path="dekont-atici" element={<DekontAtıcı />} />
          <Route path="account-settings" element={<AccountSettings />} />
          <Route path="users/new" element={<AddUser />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="tasks" element={<TasksBoard />} />
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

