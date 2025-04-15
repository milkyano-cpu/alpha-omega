"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  AuthService,
  AuthResponse,
  VerifyResponse,
} from "@/lib/auth-service";

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on initial load
    const initAuth = () => {
      const user = AuthService.getUser();
      setUser(user);
      setIsLoading(false);
    };

    initAuth();
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

      // After successful verification, update the user state if not already set
      if (response.data === true && !user) {
        const storedUser = AuthService.getUser();
        if (storedUser) {
          setUser(storedUser);
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
