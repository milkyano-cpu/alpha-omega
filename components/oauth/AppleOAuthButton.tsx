"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

interface AppleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onNeedPhoneNumber?: (profile: any, idToken: string) => void;
}

declare global {
  interface Window {
    AppleID: {
      auth: {
        init: (config: any) => void;
        signIn: (config?: any) => Promise<any>;
      };
    };
  }
}

const AppleOAuthButton: React.FC<AppleOAuthButtonProps> = ({
  onSuccess,
  onError,
  onNeedPhoneNumber,
}) => {
  const { verifyAppleAuth, loginWithExistingAppleUser } = useAuth();
  const appleButtonRef = useRef<HTMLButtonElement>(null);
  const isInitialized = useRef(false);

  const initializeAppleAuth = useCallback(() => {
    if (isInitialized.current || !window.AppleID) return;

    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const redirectURI =
      process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || window.location.origin;

    if (!clientId) {
      // Hide error - Apple auth not configured
      console.log("Apple authentication not configured - hiding Apple button");
      return;
    }

    try {
      // Initialize Apple Sign In
      window.AppleID.auth.init({
        clientId: clientId,
        scope: "name email",
        redirectURI: redirectURI,
        state: "state_" + Math.random().toString(36).substring(2, 15),
        usePopup: true,
      });

      isInitialized.current = true;
    } catch (error) {
      console.error("Apple OAuth initialization error:", error);
      onError?.("Failed to initialize Apple authentication");
    }
  }, [onError]);

  useEffect(() => {
    // Load Apple Sign In script
    const script = document.createElement("script");
    script.src =
      "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      initializeAppleAuth();
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [initializeAppleAuth]);

  const handleAppleSignIn = useCallback(async () => {
    if (!window.AppleID) {
      onError?.("Apple Sign In is not available");
      return;
    }

    try {
      const data = await window.AppleID.auth.signIn();
      console.log("Apple OAuth response:", data);

      if (!data.authorization?.id_token) {
        onError?.("No credential received from Apple");
        return;
      }

      const idToken = data.authorization.id_token;
      const authorizationCode = data.authorization.code;

      // Send the ID token to our backend for verification
      const result = await verifyAppleAuth(idToken, authorizationCode);

      if (result.data.type === "new_user") {
        // New user - needs phone number
        onNeedPhoneNumber?.(result.data.profile, idToken);
      } else if (result.data.type === "existing_user") {
        // Existing user - login successful
        await loginWithExistingAppleUser(result.data);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("Apple OAuth sign in failed:", error);

      // Handle specific Apple errors
      if (error.error === "popup_closed_by_user") {
        // User closed popup - don't show error
        return;
      }

      onError?.(error.response?.data?.error || "Apple authentication failed");
    }
  }, [
    verifyAppleAuth,
    loginWithExistingAppleUser,
    onSuccess,
    onError,
    onNeedPhoneNumber,
  ]);

  // Don't render if Apple client ID is not configured
  if (!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="apple-oauth-container w-full">
      <div className="flex justify-center">
        <button
          ref={appleButtonRef}
          onClick={handleAppleSignIn}
          disabled={!isInitialized.current}
          className="apple-oauth-button w-full max-w-sm h-10 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-black text-white hover:bg-gray-800 transition-colors text-sm font-medium"
          style={{ minHeight: "40px" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09999 22C7.78999 22.05 6.79999 20.68 5.95999 19.47C4.24999 17 2.93999 12.45 4.69999 9.39C5.56999 7.87 7.13999 6.91 8.81999 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
          </svg>
          Continue with Apple
        </button>
      </div>
    </div>
  );
};

export default AppleOAuthButton;