// lib/auth-service.ts

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
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to register");
    }

    const responseData = await response.json();
    
    // Store both token and user data in localStorage
    if (responseData.data && responseData.data.token) {
      localStorage.setItem("token", responseData.data.token);
      localStorage.setItem("user", JSON.stringify(responseData.data.user));
    }
    
    return responseData;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to login");
    }

    const responseData = await response.json();
    
    // Store token and user data in localStorage
    if (responseData.data && responseData.data.token) {
      localStorage.setItem("token", responseData.data.token);
      localStorage.setItem("user", JSON.stringify(responseData.data.user));
    }
    
    return responseData;
  },

  async verify(data: VerifyRequest): Promise<VerifyResponse> {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to verify OTP");
    }

    const verifyResponse = await response.json();
    
    // If verification was successful, we need to get user data
    // We have to make an additional request to get user info
    // since we don't have it from registration
    if (verifyResponse.data === true) {
      try {
        // Get user data from /me endpoint
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${this.getToken()}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Now we can store the verified user
          if (userData.user) {
            localStorage.setItem("user", JSON.stringify(userData.user));
          }
        }
      } catch (error) {
        console.error("Error fetching user data after verification:", error);
        // We still return the verification response even if user fetch fails
      }
    }
    
    return verifyResponse;
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