// lib/auth-service.ts
import { API } from './api-client';

export interface User {
  id: number;
  square_up_id: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname: string;
  phone_number: string;
  birthday: string;
  role: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  nickname: string;
  phone_number: string;
  birthday: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyRequest {
  phone_number: string;
  otp_code: string;
}

export interface ResendOtpRequest {
  phone_number: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
    verification_sid?: string;
  };
  status_code: number;
  message: string;
}

export interface VerifyResponse {
  data: boolean;
  status_code: number;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

console.log("API_URL", API_URL);

export const AuthService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const responseData = await API.post<AuthResponse>('/auth/register', data);
      
      // Store both token and user data in localStorage
      if (responseData.data && responseData.data.token) {
        localStorage.setItem("token", responseData.data.token);
        localStorage.setItem("user", JSON.stringify(responseData.data.user));
      }
      
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to register");
    }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const responseData = await API.post<AuthResponse>('/auth/login', data);
      
      // Store token and user data in localStorage
      if (responseData.data && responseData.data.token) {
        localStorage.setItem("token", responseData.data.token);
        localStorage.setItem("user", JSON.stringify(responseData.data.user));
      }
      
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to login");
    }
  },

  async verify(data: VerifyRequest): Promise<VerifyResponse> {
    try {
      const verifyResponse = await API.post<VerifyResponse>('/auth/verify', data);
      
      // If verification was successful, we need to get user data
      // We have to make an additional request to get user info
      // since we don't have it from registration
      if (verifyResponse.data === true) {
        try {
          // Get user data from /me endpoint
          const userData = await API.get('/auth/me');
          
          // Now we can store the verified user
          if (userData.user) {
            localStorage.setItem("user", JSON.stringify(userData.user));
          }
        } catch (error) {
          console.error("Error fetching user data after verification:", error);
          // We still return the verification response even if user fetch fails
        }
      }
      
      return verifyResponse;
    } catch (error: any) {
      throw new Error(error.message || "Failed to verify OTP");
    }
  },

  async resendOtp(data: ResendOtpRequest): Promise<any> {
    try {
      const response = await API.post('/auth/resend-otp', data);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to resend verification code");
    }
  },

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  },

  getUser(): User | null {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};