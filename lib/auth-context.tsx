"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  AuthService,
  AuthResponse,
  VerifyResponse,
} from "@/lib/auth-service";
import { isTokenExpired, decodeToken } from "@/lib/token-utils";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (userData: any) => Promise<AuthResponse>;
  verify: (phoneNumber: string, otpCode: string) => Promise<VerifyResponse>;
  resendOtp: (phoneNumber: string) => Promise<any>;
  logout: () => void;
  verifyGoogleAuth: (idToken: string) => Promise<any>;
  completeGoogleAuth: (idToken: string, phoneNumber: string) => Promise<AuthResponse>;
  loginWithExistingGoogleUser: (response: any) => Promise<AuthResponse>;
  verifyAppleAuth: (idToken: string, authorizationCode?: string) => Promise<any>;
  completeAppleAuth: (idToken: string, phoneNumber: string) => Promise<AuthResponse>;
  loginWithExistingAppleUser: (response: any) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = AuthService.getUser();
    
    // If no stored user but we have a token, try to decode user from token
    if (!storedUser && typeof window !== 'undefined') {
      const token = AuthService.getToken();
      if (token) {
        try {
          const payload = decodeToken(token);
          // Create user object from token payload
          const userFromToken: User = {
            id: payload.id,
            square_up_id: '', // Not in token
            email: payload.email,
            first_name: payload.first_name,
            last_name: payload.last_name,
            nickname: payload.first_name, // Fallback
            phone_number: payload.phone,
            birthday: '', // Not in token
            role: payload.role,
            verified: payload.verified,
            created_at: '', // Not in token
            updated_at: '' // Not in token
          };
          console.log('🔍 AuthContext - Created user from token:', { verified: userFromToken.verified });
          return userFromToken;
        } catch (error) {
          console.error('Error creating user from token:', error);
        }
      }
    }
    
    return storedUser;
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to verify token validity
  const verifyTokenExpiration = () => {
    if (typeof window === 'undefined') return;
    
    const token = AuthService.getToken();
    if (!token) {
      setUser(null);
      return;
    }
    
    // Check if token is expired using our utility function
    if (isTokenExpired(token)) {
      // Clear user data and token if expired
      AuthService.logout();
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

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    setIsLoading(true);
    try {
      const response = await AuthService.login({ email, password, rememberMe });
      setUser(response.data.user);
      // Store user and token in localStorage/sessionStorage is handled in the service
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

  const resendOtp = async (phoneNumber: string) => {
    try {
      const response = await AuthService.resendOtp({
        phone_number: phoneNumber,
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyGoogleAuth = async (idToken: string) => {
    try {
      const response = await AuthService.verifyGoogleAuth(idToken);
      return response;
    } catch (error) {
      console.error("Google OAuth verification error:", error);
      throw error;
    }
  };

  const completeGoogleAuth = async (idToken: string, phoneNumber: string) => {
    try {
      const response = await AuthService.completeGoogleAuth(idToken, phoneNumber);
      
      // Update auth state
      setUser(response.data.user);
      setIsLoading(false);
      
      return response;
    } catch (error) {
      setIsLoading(false);
      console.error("Google OAuth completion error:", error);
      throw error;
    }
  };

  const loginWithExistingGoogleUser = async (response: any) => {
    try {
      // Store token and user data for existing user (similar to regular login)
      if (response.token) {
        // Default to remember me for OAuth logins
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Also set as cookie for middleware access
        const expires = '; expires=' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? '; secure' : '';
        document.cookie = `token=${response.token}; path=/${expires}${secureFlag}; samesite=lax`;
        
        console.log('🍪 Setting cookie for existing Google user:', { hasToken: !!response.token });
      }
      
      // Update auth state for existing user
      setUser(response.user);
      setIsLoading(false);
      
      return response;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const verifyAppleAuth = async (idToken: string, authorizationCode?: string) => {
    try {
      const response = await AuthService.verifyAppleAuth(idToken, authorizationCode);
      return response;
    } catch (error) {
      console.error("Apple OAuth verification error:", error);
      throw error;
    }
  };

  const completeAppleAuth = async (idToken: string, phoneNumber: string) => {
    try {
      const response = await AuthService.completeAppleAuth(idToken, phoneNumber);
      
      // Update auth state
      setUser(response.data.user);
      setIsLoading(false);
      
      return response;
    } catch (error) {
      setIsLoading(false);
      console.error("Apple OAuth completion error:", error);
      throw error;
    }
  };

  const loginWithExistingAppleUser = async (response: any) => {
    try {
      // Store token and user data for existing user (similar to regular login)
      if (response.token) {
        // Default to remember me for OAuth logins
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Also set as cookie for middleware access
        const expires = '; expires=' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? '; secure' : '';
        document.cookie = `token=${response.token}; path=/${expires}${secureFlag}; samesite=lax`;
        
        console.log('🍪 Setting cookie for existing Apple user:', { hasToken: !!response.token });
      }
      
      // Update auth state for existing user
      setUser(response.user);
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
        setUser,
        login,
        register,
        verify,
        resendOtp,
        logout,
        verifyGoogleAuth,
        completeGoogleAuth,
        loginWithExistingGoogleUser,
        verifyAppleAuth,
        completeAppleAuth,
        loginWithExistingAppleUser,
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
