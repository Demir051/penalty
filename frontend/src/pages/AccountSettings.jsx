import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Divider,
  Avatar,
  Box,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AccountSettings = () => {
  const { user, refreshUser } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    setProfileImage(user?.profileImage || '');
    setFullName(user?.fullName || '');
  }, [user]);

  const handleProfileSave = async () => {
    setProfileMessage({ type: '', text: '' });
    setLoadingProfile(true);
    try {
      await axios.patch('/users/me/profile', { profileImage, fullName });
      await refreshUser();
      setProfileMessage({ type: 'success', text: 'Profil bilgileri güncellendi' });
    } catch (error) {
      setProfileMessage({
        type: 'error',
        text: error.response?.data?.message || 'Profil güncellenemedi',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Yeni şifreler uyuşmuyor' });
      return;
    }
    setPasswordMessage({ type: '', text: '' });
    setLoadingPassword(true);
    try {
      await axios.patch('/users/me/password', { currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Şifre güncellendi' });
      e.currentTarget.reset();
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.message || 'Şifre güncellenemedi',
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 3, position: 'relative' }}>
          {loadingProfile && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <CircularProgress size={32} />
            </Box>
          )}
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Profil
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Profil fotoğrafı ve ad soyad bilgisi.
          </Typography>

          {profileMessage.text && (
            <Alert severity={profileMessage.type} sx={{ mb: 2 }}>
              {profileMessage.text}
            </Alert>
          )}

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Avatar
              src={profileImage || undefined}
              sx={{ width: 64, height: 64 }}
            >
              {fullName?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Profil Fotoğrafı URL"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://..."
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                label="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Box>
          </Stack>
          <Button variant="contained" onClick={handleProfileSave} disabled={loadingProfile}>
            {loadingProfile ? 'Kaydediliyor...' : 'Profil Kaydet'}
          </Button>
        </Paper>

        <Paper sx={{ p: 3, position: 'relative' }}>
          {loadingPassword && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <CircularProgress size={32} />
            </Box>
          )}
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Şifre Değiştir
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Mevcut şifreni doğrula ve yeni şifreni belirle.
          </Typography>

          {passwordMessage.text && (
            <Alert severity={passwordMessage.type} sx={{ mb: 2 }}>
              {passwordMessage.text}
            </Alert>
          )}

          <form onSubmit={handlePasswordSave}>
            <Stack spacing={2}>
              <TextField
                label="Mevcut Şifre"
                name="currentPassword"
                type="password"
                required
              />
              <TextField
                label="Yeni Şifre"
                name="newPassword"
                type="password"
                required
              />
              <TextField
                label="Yeni Şifre (Tekrar)"
                name="confirmPassword"
                type="password"
                required
              />
              <Button type="submit" variant="contained" disabled={loadingPassword}>
                {loadingPassword ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
};

export default AccountSettings;

