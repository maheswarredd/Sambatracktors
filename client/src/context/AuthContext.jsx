import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from './LanguageContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('samba_token') || null);
  const [loading, setLoading] = useState(true);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            if (res.data.language) {
              setLanguage(res.data.language);
            }
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Auth token verification failed:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (emailOrPhone, password) => {
    const res = await api.login({ emailOrPhone, password });
    if (res.success && res.data) {
      localStorage.setItem('samba_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      if (res.data.language) {
        setLanguage(res.data.language);
      }
      return res.data;
    }
  };

  const signup = async (formData) => {
    const res = await api.signup(formData);
    if (res.success && res.data) {
      localStorage.setItem('samba_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      if (res.data.language) {
        setLanguage(res.data.language);
      }
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('samba_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
