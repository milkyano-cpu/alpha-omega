import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Base API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility to handle redirects to login
const redirectToLogin = () => {
  // Only redirect in browser environment and if we're not already on the login page
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      // Store the current path so we can redirect back after login
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnUrl=${returnUrl}`;
    }
  }
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Only add token in browser environment
    if (typeof window !== 'undefined') {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Check if error response indicates an expired token or unauthorized access
    if (error.response?.status === 401) {
      // Clear token and user data from both storage locations
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
      
      // Redirect to login page
      redirectToLogin();
    }
    
    // Handle different response data structures
    const errorData = error.response?.data as any;
    const errorMessage = errorData?.message || error.message || 'An unexpected error occurred';
    
    // Format error response consistently
    const errorResponse = {
      status: error.response?.status || 500,
      message: errorMessage,
      data: error.response?.data || null,
    };

    return Promise.reject(errorResponse);
  }
);

// Helper methods for common API operations
export const API = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config).then(response => response.data),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config).then(response => response.data),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config).then(response => response.data),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config).then(response => response.data),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config).then(response => response.data),
};

export default apiClient;
