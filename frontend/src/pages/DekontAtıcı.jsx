import { Container, Typography, Paper, Box } from '@mui/material';

const DekontAtıcı = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dekont Atıcı
      </Typography>
      <Paper sx={{ p: 4, mt: 2 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            This page is under construction
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DekontAtıcı;



