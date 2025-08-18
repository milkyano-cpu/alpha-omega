"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onNeedPhoneNumber?: (profile: any, idToken: string) => void;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  onNeedPhoneNumber,
}) => {
  const { verifyGoogleAuth, loginWithExistingGoogleUser } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  const initializeGoogleAuth = useCallback(() => {
    if (isInitialized.current || !window.google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.(
        "Google authentication is not configured. Please contact support."
      );
      return;
    }

    try {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            console.log("Google OAuth response:", response);

            const idToken = response.credential;
            if (!idToken) {
              onError?.("No credential received from Google");
              return;
            }

            // Send the ID token to our backend for verification
            const result = await verifyGoogleAuth(idToken);

            if (result.data.type === "new_user") {
              // New user - needs phone number
              onNeedPhoneNumber?.(result.data.profile, idToken);
            } else if (result.data.type === "existing_user") {
              // Existing user - login successful
              await loginWithExistingGoogleUser(result.data);
              onSuccess?.();
            }
          } catch (error: any) {
            console.error("Google OAuth verification failed:", error);
            onError?.(
              error.response?.data?.error || "Google authentication failed"
            );
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        locale: "en_US",
      });

      // Render button for all devices in the same way
      if (googleButtonRef.current) {
        (window.google.accounts.id as any).renderButton(
          googleButtonRef.current,
          {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "continue_with",
            shape: "rectangular",
            width: googleButtonRef.current.offsetWidth || 300,
            locale: "en_US",
          }
        );

        // Apply minimal styling - just ensure consistent height
        setTimeout(() => {
          const googleBtn = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
          if (googleBtn) {
            // Only set height, let Google handle its own width
            googleBtn.style.height = "40px";
            googleBtn.style.minHeight = "40px";
            googleBtn.style.maxHeight = "40px";
          }
        }, 100);
      }

      // Try One Tap prompt for desktop only
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      if (!isMobile) {
        try {
          window.google.accounts.id.prompt();
        } catch {
          console.log(
            "Google One Tap prompt failed, user can click the button"
          );
        }
      }

      isInitialized.current = true;
    } catch (error) {
      console.error("Google OAuth initialization error:", error);
      onError?.("Failed to initialize Google authentication");
    }
  }, [
    verifyGoogleAuth,
    loginWithExistingGoogleUser,
    onSuccess,
    onError,
    onNeedPhoneNumber,
  ]);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      initializeGoogleAuth();
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [initializeGoogleAuth]);

  return (
    <div className="google-oauth-container w-full">
      <div className="flex justify-center">
        <div
          ref={googleButtonRef}
          className="flex justify-center items-center w-full max-w-sm"
          style={{ minHeight: "40px" }}
        />
      </div>
    </div>
  );
};

export default GoogleOAuthButton;