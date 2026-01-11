import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, Alert } from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';

const ErrorPage = ({ title = 'Bir Hata Oluştu', message = 'Üzgünüz, bir hata oluştu.', showBackButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {showBackButton && (
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ borderRadius: '12px' }}
            >
              Geri Dön
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => navigate('/dashboard')}
            sx={{ borderRadius: '12px' }}
          >
            Ana Sayfaya Dön
          </Button>
        </Box>

        {location.pathname && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            Hatalı URL: {location.pathname}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ErrorPage;

