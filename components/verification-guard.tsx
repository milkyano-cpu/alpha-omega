"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthService } from "@/lib/auth-service";
import { decodeToken } from "@/lib/token-utils";

interface VerificationGuardProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function VerificationGuard({ 
  children, 
  requireVerification = false 
}: VerificationGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  console.log('🔍 VerificationGuard - Rendering with:', {
    requireVerification,
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    userVerified: user?.verified
  });

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // If verification is required, check both user data and JWT token
    if (requireVerification && isAuthenticated) {
      let isVerified = false;
      
      // First, check the JWT token directly (most up-to-date)
      const token = AuthService.getToken();
      if (token) {
        try {
          const payload = decodeToken(token);
          isVerified = payload.verified;
          console.log('🔍 VerificationGuard - Token verified status:', payload.verified);
        } catch (error) {
          console.error('Error decoding token in VerificationGuard:', error);
        }
      }
      
      // Fallback to user data if token check fails
      if (!isVerified && user) {
        isVerified = user.verified;
        console.log('🔍 VerificationGuard - User data verified status:', user.verified);
      }
      
      // If user is not verified, redirect to verification page
      if (!isVerified && user) {
        console.log('🔍 VerificationGuard - Redirecting to verify page');
        const phoneNumber = user.phone_number;
        
        if (phoneNumber) {
          // Redirect to verification page with phone number
          router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
        } else {
          // If no phone number, redirect to signup
          router.push('/signup');
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requireVerification, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If verification is required but user is not verified, don't render children
  if (requireVerification && isAuthenticated && user) {
    let isVerified = false;
    
    // Check JWT token first (most up-to-date)
    const token = AuthService.getToken();
    if (token) {
      try {
        const payload = decodeToken(token);
        isVerified = payload.verified;
      } catch {
        // Fall back to user data if token decode fails
        isVerified = user.verified;
      }
    } else {
      isVerified = user.verified;
    }
    
    // Don't render children if not verified
    if (!isVerified) {
      return null;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}