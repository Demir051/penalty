import { useEffect, useState, useRef } from 'react';
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
  IconButton,
} from '@mui/material';
import { PhotoCamera, Edit } from '@mui/icons-material';
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      // User'dan gelen profileImage'i state'e set et
      const userProfileImage = user.profileImage || '';
      setProfileImage(userProfileImage);
      const userFullName = user.fullName || '';
      setFullName(userFullName);
    }
  }, [user?.profileImage, user?.fullName]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Sadece resim dosyaları seçilebilir' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Resim boyutu 5MB\'dan küçük olmalıdır' });
      return;
    }

    handleImageUpload(file);
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post('/api/users/me/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Backend'den dönen profileImage URL'ini al
      const uploadedImageUrl = response.data.profileImage || response.data.user?.profileImage;
      
      if (!uploadedImageUrl) {
        throw new Error('Profil resmi URL\'i alınamadı');
      }
      
      // State'i hemen güncelle (relative path olarak)
      setProfileImage(uploadedImageUrl);
      
      // User context'ini güncelle (bu da profileImage'i güncelleyecek)
      await refreshUser();
      
      setProfileMessage({ type: 'success', text: 'Profil resmi başarıyla yüklendi' });
    } catch (error) {
      console.error('Profile image upload error:', error);
      setProfileMessage({
        type: 'error',
        text: error.response?.data?.message || 'Resim yüklenemedi',
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleProfileSave = async () => {
    setProfileMessage({ type: '', text: '' });
    setLoadingProfile(true);
    try {
      await axios.patch('/api/users/me/profile', { profileImage, fullName });
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
      await axios.patch('/api/users/me/password', { currentPassword, newPassword });
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Profil fotoğrafı ve ad soyad bilgisi.
          </Typography>

          {profileMessage.text && (
            <Alert severity={profileMessage.type} sx={{ mb: 2 }}>
              {profileMessage.text}
            </Alert>
          )}

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={
                  profileImage 
                    ? (() => {
                        // Eğer absolute URL ise (http/https ile başlıyorsa) direkt kullan
                        if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
                          return profileImage;
                        }
                        // Eğer data URL ise direkt kullan
                        if (profileImage.startsWith('data:')) {
                          return profileImage;
                        }
                        // Relative path ise full URL oluştur (backend'den gelen /uploads/... formatı)
                        // Backend'de /uploads static file serving var, bu yüzden baseURL kullan
                        const baseURL = axios.defaults.baseURL || window.location.origin;
                        // Eğer zaten / ile başlıyorsa direkt ekle, değilse / ekle
                        return profileImage.startsWith('/') 
                          ? `${baseURL}${profileImage}`
                          : `${baseURL}/${profileImage}`;
                      })()
                    : undefined
                }
                sx={{ width: 80, height: 80, cursor: uploadingImage ? 'wait' : 'pointer' }}
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
              >
                {fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  width: 28,
                  height: 28,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <CircularProgress size={16} sx={{ color: 'inherit' }} />
                ) : (
                  <PhotoCamera sx={{ fontSize: 16 }} />
                )}
              </IconButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Profil Fotoğrafı URL (İsteğe bağlı)"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://... veya dosya yükleyin"
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
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
                inputProps={{ minLength: 6 }}
                helperText="En az 6 karakter olmalıdır"
              />
              <TextField
                label="Yeni Şifre (Tekrar)"
                name="confirmPassword"
                type="password"
                required
                inputProps={{ minLength: 6 }}
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

