import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Payment,
  Support,
  Business,
  Warning,
} from '@mui/icons-material';
import OdemeMailleri from './mailmatik/OdemeMailleri';
import DestekMailleri from './mailmatik/DestekMailleri';
import NoraminMailleri from './mailmatik/NoraminMailleri';
import AcilMailleri from './mailmatik/AcilMailleri';

const Mailmatik = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to default tab if on base route
  useEffect(() => {
    if (location.pathname === '/dashboard/mailmatik' || location.pathname === '/dashboard/mailmatik/') {
      navigate('/dashboard/mailmatik/odeme', { replace: true });
    }
  }, [location.pathname, navigate]);

  const getTabValue = () => {
    if (location.pathname.includes('/odeme')) return 0;
    if (location.pathname.includes('/destek')) return 1;
    if (location.pathname.includes('/noramin')) return 2;
    if (location.pathname.includes('/acil')) return 3;
    return 0;
  };

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/dashboard/mailmatik/odeme');
        break;
      case 1:
        navigate('/dashboard/mailmatik/destek');
        break;
      case 2:
        navigate('/dashboard/mailmatik/noramin');
        break;
      case 3:
        navigate('/dashboard/mailmatik/acil');
        break;
      default:
        navigate('/dashboard/mailmatik/odeme');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Mailmatik
      </Typography>

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={getTabValue()}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<Payment />}
            iconPosition="start"
            label="Ödeme Mailleri"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Support />}
            iconPosition="start"
            label="Destek Mailleri"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Business />}
            iconPosition="start"
            label="Noramin Mailleri"
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<Warning />}
            iconPosition="start"
            label="Acil Mailleri"
            sx={{ gap: 1 }}
          />
        </Tabs>
      </Paper>

      <Box>
        <Routes>
          <Route index element={<OdemeMailleri />} />
          <Route path="odeme" element={<OdemeMailleri />} />
          <Route path="destek" element={<DestekMailleri />} />
          <Route path="noramin" element={<NoraminMailleri />} />
          <Route path="acil" element={<AcilMailleri />} />
        </Routes>
      </Box>
    </Container>
  );
};

export default Mailmatik;
