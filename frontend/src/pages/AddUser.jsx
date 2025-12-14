import { useState } from 'react';
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
} from '@mui/material';
import axios from 'axios';

const AddUser = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'uye',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);
    try {
      await axios.post('/api/users', form);
      setMessage({ type: 'success', text: 'Kullanıcı başarıyla eklendi' });
      setForm({ username: '', email: '', fullName: '', password: '', role: 'uye' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Kullanıcı eklenemedi',
      });
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
              required
            />
            <TextField
              label="E-posta"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <TextField
              label="Ad Soyad"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />
            <TextField
              label="Şifre"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <TextField
              select
              label="Rol"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <MenuItem value="uye">Üye</MenuItem>
              <MenuItem value="ceza">Ceza</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kullanıcı Ekle'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AddUser;

