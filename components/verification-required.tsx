"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// This component will check if a user is verified and redirect to verification page if not
export function VerificationRequired({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If authenticated but not verified, redirect to verification page
    if (isAuthenticated && user && user.verified === false) {
      router.push(`/verify?phone=${encodeURIComponent(user.phone_number)}`);
    }
  }, [user, isAuthenticated, router]);

  // If user is verified or not authenticated, render children
  // Not authenticated users will be handled by other auth protection if needed
  return <>{children}</>;
}
