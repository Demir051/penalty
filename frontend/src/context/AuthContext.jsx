import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Base URL - sadece domain, path'lerde /api kullanılacak
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  const attachToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      attachToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      attachToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      // Only log errors in development
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }
      
      let errorMessage = 'Giriş başarısız. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.';
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = 'Bağlantı hatası: Sunucuya ulaşılamıyor. Lütfen backend\'in çalıştığından emin olun.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Sunucu hatası: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Sunucudan yanıt alınamadı. Lütfen backend\'in çalıştığından emin olun.';
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    attachToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      setGlobalLoading(true);
      const response = await axios.get('/api/users/me');
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      // ignore silently; caller may handle
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser, globalLoading, setGlobalLoading }}>
      {children}
    </AuthContext.Provider>
  );
};



