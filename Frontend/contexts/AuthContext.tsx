"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, AuthUser, Company } from '@/lib/api';

type User = AuthUser;

interface AuthContextType {
  user: User | null;
  company: Company | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  registerAdmin: (userData: any) => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth data from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedCompany = localStorage.getItem('company');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedCompany) {
        setCompany(JSON.parse(storedCompany));
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      
      setUser(response.user);
      setCompany(response.company);
      setToken(response.accessToken);

      // Store in localStorage
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem('company', JSON.stringify(response.company));
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      
      setUser(response.user);
      setCompany(response.company);
      setToken(response.accessToken);

      // Store in localStorage
      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem('company', JSON.stringify(response.company));
      }
    } catch (error) {
      throw error;
    }
  };

  const registerAdmin = async (userData: any) => {
    try {
      const response = await authAPI.registerAdmin(userData);

      setUser(response.user);
      setCompany(response.company);
      setToken(response.accessToken);

      localStorage.setItem('token', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem('company', JSON.stringify(response.company));
      } else {
        localStorage.removeItem('company');
      }
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData: any) => {
    if (!token) {
      throw new Error('You must be logged in to update profile');
    }

    const response = await authAPI.updateProfile(token, profileData);
    setUser(response.user);
    setCompany(response.company);

    localStorage.setItem('user', JSON.stringify(response.user));
    if (response.company) {
      localStorage.setItem('company', JSON.stringify(response.company));
    } else {
      localStorage.removeItem('company');
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        login,
        register,
        registerAdmin,
        updateProfile,
        logout,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
