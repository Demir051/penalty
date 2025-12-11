import { useEffect, useState } from 'react';
import { LinearProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const GlobalLoader = () => {
  const { globalLoading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (globalLoading) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(t);
    }
  }, [globalLoading]);

  if (!visible) return null;
  return <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }} />;
};

export default GlobalLoader;

