import { Container, Typography, Paper, Box } from '@mui/material';

const Mailmatik = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Mailmatik
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

export default Mailmatik;



