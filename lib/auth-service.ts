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
  password?: string | null; // Indicates if user has a password (for OAuth vs standard users)
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
  rememberMe?: boolean;
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
        
        // Also set as cookie for middleware access (default to remember me for new registrations)
        const expires = '; expires=' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? '; secure' : '';
        document.cookie = `token=${responseData.data.token}; path=/${expires}${secureFlag}; samesite=lax`;
        
        console.log('🍪 Setting cookie for register:', { hasToken: !!responseData.data.token });
      }
      
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to register");
    }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const responseData = await API.post<AuthResponse>('/auth/login', data);
      
      // Store token and user data
      if (responseData.data && responseData.data.token) {
        const storage = data.rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", responseData.data.token);
        storage.setItem("user", JSON.stringify(responseData.data.user));
        
        // Also set as cookie for middleware access
        // Set cookie with appropriate expiration
        const expires = data.rememberMe ? '; expires=' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString() : '';
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? '; secure' : '';
        document.cookie = `token=${responseData.data.token}; path=/${expires}${secureFlag}; samesite=lax`;
        
        console.log('🍪 Setting cookie for login:', { hasToken: !!responseData.data.token, expires: !!expires });
        
        // Store remember me preference
        localStorage.setItem("rememberMe", data.rememberMe ? "true" : "false");
        
        // If not remembering, clear any existing localStorage auth data
        if (!data.rememberMe) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
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

  async addPhoneNumber(phoneNumber: string): Promise<any> {
    try {
      const response = await API.post('/auth/add-phone', { phone_number: phoneNumber });
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to add phone number");
    }
  },

  async updateProfile(data: any): Promise<any> {
    try {
      const response = await API.put('/auth/profile', data);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to update profile");
    }
  },

  async updatePassword(data: { current_password: string; new_password: string; confirm_password: string }): Promise<any> {
    try {
      const response = await API.put('/auth/password', data);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to update password");
    }
  },

  async createPassword(data: { new_password: string; confirm_password: string }): Promise<any> {
    try {
      const response = await API.post('/auth/create-password', data);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create password");
    }
  },

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    
    // Clear token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; secure' : '';
    document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT${secureFlag}; samesite=lax`;
    
    console.log('🍪 Clearing cookie on logout');
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      // Check localStorage first, then sessionStorage
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    }
    return null;
  },

  getUser(): User | null {
    if (typeof window !== "undefined") {
      // Check localStorage first, then sessionStorage
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
    return null;
  },

  isRemembered(): boolean {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rememberMe") === "true";
    }
    return false;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Google OAuth - Step 1: Verify token and check user status
  async verifyGoogleAuth(idToken: string): Promise<any> {
    try {
      const responseData = await API.post('/auth/google/verify', {
        idToken
      });
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to verify Google token");
    }
  },

  // Google OAuth - Step 2: Complete registration with phone number
  async completeGoogleAuth(idToken: string, phoneNumber: string): Promise<AuthResponse> {
    try {
      const responseData = await API.post<AuthResponse>('/auth/google/complete', {
        idToken,
        phoneNumber
      });
      
      // Store token and user data
      if (responseData.data && responseData.data.token) {
        localStorage.setItem("token", responseData.data.token);
        localStorage.setItem("user", JSON.stringify(responseData.data.user));
        
        // Also set as cookie for middleware access
        const expires = '; expires=' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? '; secure' : '';
        document.cookie = `token=${responseData.data.token}; path=/${expires}${secureFlag}; samesite=lax`;
        
        console.log('🍪 Setting cookie for Google OAuth:', { hasToken: !!responseData.data.token });
      }
      
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to complete Google authentication");
    }
  },

  // Apple OAuth - Step 1: Verify token and check user status
  async verifyAppleAuth(idToken: string, authorizationCode?: string): Promise<any> {
    try {
      const responseData = await API.post('/auth/apple/verify', {
        idToken,
        authorizationCode
      });
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to verify Apple token");
    }
  },

  // Apple OAuth - Step 2: Complete registration with phone number
  async completeAppleAuth(idToken: string, phoneNumber: string): Promise<AuthResponse> {
    try {
      const responseData = await API.post<AuthResponse>('/auth/apple/complete', {
        idToken,
        phoneNumber
      });
      
      // Store token and user data
      if (responseData.data && responseData.data.token) {
        localStorage.setItem("token", responseData.data.token);
        localStorage.setItem("user", JSON.stringify(responseData.data.user));
        
        // Also set as cookie for middleware access
        const expires = '; expires=' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? '; secure' : '';
        document.cookie = `token=${responseData.data.token}; path=/${expires}${secureFlag}; samesite=lax`;
        
        console.log('🍪 Setting cookie for Apple OAuth:', { hasToken: !!responseData.data.token });
      }
      
      return responseData;
    } catch (error: any) {
      throw new Error(error.message || "Failed to complete Apple authentication");
    }
  },
};