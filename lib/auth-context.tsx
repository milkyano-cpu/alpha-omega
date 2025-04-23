"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  AuthService,
  AuthResponse,
  VerifyResponse,
} from "@/lib/auth-service";
import { isTokenExpired } from "@/lib/token-utils";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  verify: (phoneNumber: string, otpCode: string) => Promise<VerifyResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    return AuthService.getUser();
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to verify token validity
  const verifyTokenExpiration = () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    
    // Check if token is expired using our utility function
    if (isTokenExpired(token)) {
      // Clear user data and token if expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      // Navigate to login if we're in a browser context
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?returnUrl=${returnUrl}`;
        }
      }
    }
  };
  
  // Check token validity on mount
  useEffect(() => {
    verifyTokenExpiration();
    setIsLoading(false);
    
    // Optional: periodically check token validity
    const intervalId = setInterval(() => {
      verifyTokenExpiration();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await AuthService.login({ email, password });
      setUser(response.data.user);
      // Store user and token in localStorage is handled in the service
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await AuthService.register(userData);
      // Update user state - but we'll check verification status
      // in components to determine if they need to verify first
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const verify = async (phoneNumber: string, otpCode: string) => {
    setIsLoading(true);
    try {
      const response = await AuthService.verify({
        phone_number: phoneNumber,
        otp_code: otpCode,
      });

      if (response && response.data === true) {
        const user = AuthService.getUser();
        if (user) {
          user.verified = true;
          localStorage.setItem("user", JSON.stringify(user));
        }
      }

      setIsLoading(false);
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verify,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
