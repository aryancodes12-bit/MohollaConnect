import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { setAuthToken } from '../services/api';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('localconnect_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('localconnect_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      setToken(data.token);
      setUser(userData);
      localStorage.setItem('localconnect_token', data.token);
      localStorage.setItem('localconnect_user', JSON.stringify(userData));
      setAuthToken(data.token);
      setLoading(false);
      return { success: true, role: data.role };
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const data = response.data;
      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      setToken(data.token);
      setUser(userData);
      localStorage.setItem('localconnect_token', data.token);
      localStorage.setItem('localconnect_user', JSON.stringify(userData));
      setAuthToken(data.token);
      setLoading(false);
      return { success: true, role: data.role };
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || 'Registration failed';
      return { success: false, error: msg };
    }
  };

  const loginWithGoogle = async (mode = 'login', selectedRole = 'BUYER') => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const response = await api.post('/auth/google', {
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        role: selectedRole,
        mode: mode,
        photoUrl: firebaseUser.photoURL,
        googleId: firebaseUser.uid,
      });

      const data = response.data;
      const userData = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        photoUrl: firebaseUser.photoURL,
      };

      setToken(data.token);
      setUser(userData);
      localStorage.setItem('localconnect_token', data.token);
      localStorage.setItem('localconnect_user', JSON.stringify(userData));
      setAuthToken(data.token);
      setLoading(false);
      return { success: true, role: data.role };
    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Google sign-in popup closed before completion.' };
      }
      if (error.code === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Sign-in cancelled.' };
      }
      const msg = error.response?.data?.message || error.message || 'Google authentication failed';
      const isNotRegistered = error.response?.status === 400 && msg.toLowerCase().includes('register first');
      return { 
        success: false, 
        error: msg,
        notRegistered: isNotRegistered,
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('localconnect_token');
    localStorage.removeItem('localconnect_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
