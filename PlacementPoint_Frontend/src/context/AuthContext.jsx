import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem('user_profile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me/');
          setUser(res.data.user);
          setProfile(res.data.profile);
          localStorage.setItem('user_data', JSON.stringify(res.data.user));
          if (res.data.profile) {
            localStorage.setItem('user_profile', JSON.stringify(res.data.profile));
          }
        } catch (err) {
          console.error('Failed to load current user profile:', err);
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    const { access, refresh, user: userData, profile: profileData } = res.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user_data', JSON.stringify(userData));
    if (profileData) {
      localStorage.setItem('user_profile', JSON.stringify(profileData));
    }

    setUser(userData);
    setProfile(profileData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_profile');
    setUser(null);
    setProfile(null);
  };

  const updateFirstLoginStatus = () => {
    if (user) {
      const updatedUser = { ...user, is_first_login: false };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
        updateFirstLoginStatus,
        isAuthenticated: !!user,
        role: user?.role || null,
        isFirstLogin: user?.is_first_login || false
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
