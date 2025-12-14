import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  MenuItem,
  CircularProgress,
  Box,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AddUser = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'uye',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 2, display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (user && user.role !== 'admin') {
    return (
      <Container maxWidth="sm" sx={{ mt: 2 }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Container>
    );
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.username.trim()) {
      newErrors.username = 'Kullanıcı adı gereklidir';
    } else if (form.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    }

    if (!form.email.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Ad soyad gereklidir';
    } else if (form.fullName.length < 2) {
      newErrors.fullName = 'Ad soyad en az 2 karakter olmalıdır';
    }

    if (!form.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (form.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Clear message when user makes changes
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Lütfen formu kontrol ediniz' });
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/users', form);
      setMessage({ type: 'success', text: 'Kullanıcı başarıyla eklendi' });
      setForm({ username: '', email: '', fullName: '', password: '', role: 'uye' });
      setErrors({});
      // Optionally navigate after 3 seconds (user can see success message)
      setTimeout(() => {
        navigate('/dashboard/users');
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Kullanıcı eklenemedi';
      setMessage({ type: 'error', text: errorMessage });
      
      // Set specific field errors if available
      if (error.response?.data?.field) {
        setErrors((prev) => ({ ...prev, [error.response.data.field]: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CircularProgress size={32} />
          </Box>
        )}
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Yeni Kullanıcı Ekle
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sadece adminler kullanıcı ekleyebilir.
        </Typography>

        {message.text && (
          <Alert severity={message.type} sx={{ mt: 2, mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Kullanıcı Adı"
              name="username"
              value={form.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              required
              disabled={loading}
              inputProps={{ minLength: 3 }}
            />
            <TextField
              label="E-posta"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
              disabled={loading}
            />
            <TextField
              label="Ad Soyad"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              helperText={errors.fullName}
              required
              disabled={loading}
              inputProps={{ minLength: 2 }}
            />
            <TextField
              label="Şifre"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || 'En az 6 karakter'}
              required
              disabled={loading}
              inputProps={{ minLength: 6 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Rol"
              name="role"
              value={form.role}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <MenuItem value="uye">Üye</MenuItem>
              <MenuItem value="ceza">Ceza</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              fullWidth
              size="large"
            >
              {loading ? 'Kaydediliyor...' : 'Kullanıcı Ekle'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AddUser;

