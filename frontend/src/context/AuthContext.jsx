import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Base URL - sadece domain, path'lerde /api kullanılacak
const apiBaseUrl = import.meta.env.VITE_API_URL;
if (apiBaseUrl) {
  // Eğer VITE_API_URL /api ile bitiyorsa onu kaldır
  axios.defaults.baseURL = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl.replace(/\/api$/, '');
} else {
  // Development için
  axios.defaults.baseURL = 'http://localhost:5000';
}

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
      console.log('Attempting login to:', axios.defaults.baseURL);
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
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed. Please check your connection and try again.',
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



