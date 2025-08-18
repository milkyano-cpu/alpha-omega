/**
 * Token utilities for handling JWT tokens
 */
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";

// Define the expected token payload structure
export interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  verified: boolean;
  role: string;
}

/**
 * Parse a JWT token and extract the payload
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    // Use jwt-decode library to decode the token
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

/**
 * Check if a token is expired based on its exp claim
 * @param token JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;
  
  try {
    const payload = parseJwt(token);
    if (!payload) return true;
    
    // Check if the token has an expiration claim
    if (!payload.exp) return false; // No expiration, assume valid
    
    // Convert exp to milliseconds (JWT exp is in seconds)
    const expiration = payload.exp * 1000;
    const currentTime = Date.now();
    
    // Add a small buffer (5 seconds) to account for potential timing issues
    return currentTime > expiration - 5000;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If we can't verify, treat as expired
  }
}

/**
 * Get remaining time in seconds before token expiration
 * @param token JWT token string
 * @returns Seconds remaining until expiration, or 0 if expired/invalid
 */
export function getTokenRemainingTime(token: string): number {
  if (!token) return 0;
  
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return 0;
    
    const expiration = payload.exp * 1000;
    const currentTime = Date.now();
    const remainingMs = expiration - currentTime;
    
    return Math.max(0, Math.floor(remainingMs / 1000));
  } catch (error) {
    console.error('Error calculating token remaining time:', error);
    return 0;
  }
}

/**
 * Decode a JWT token and extract user information
 * @param token JWT token string
 * @returns Decoded token payload with user information
 */
export function decodeToken(token: string): TokenPayload {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    throw new Error('Invalid token');
  }
}
