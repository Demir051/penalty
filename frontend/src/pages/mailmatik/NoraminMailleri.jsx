import { Container, Typography, Paper, Box } from '@mui/material';
import { Business } from '@mui/icons-material';

const NoraminMailleri = () => {
  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Business sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Noramin Mailleri
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Noramin mailleri sayfası yakında eklenecek
        </Typography>
      </Box>
    </Paper>
  );
};

export default NoraminMailleri;

