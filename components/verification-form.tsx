"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { AuthService } from "@/lib/auth-service";
import { decodeToken } from "@/lib/token-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function VerificationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [needsPhoneNumber, setNeedsPhoneNumber] = useState(false);
  const [tempPhoneInput, setTempPhoneInput] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resendOtp } = useAuth();

  useEffect(() => {
    // Check if user is already verified
    const token = AuthService.getToken();
    if (token) {
      try {
        const payload = decodeToken(token);
        if (payload.verified) {
          console.log('User already verified, redirecting to home');
          router.push("/");
          return;
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    }

    const phone = searchParams.get("phone");
    if (phone) {
      // Use the phone number as-is - our backend will handle formatting
      setPhoneNumber(phone);
      // For phone from URL (new registrations), OTP should already be sent during registration
      // No need to send again automatically
    } else {
      // If no phone parameter, try to get it from user data
      const token = AuthService.getToken();
      if (token) {
        try {
          const payload = decodeToken(token);
          if (payload.phone) {
            console.log('🔍 VerificationForm - Using phone from token:', payload.phone);
            setPhoneNumber(payload.phone);
            // Automatically send OTP to existing phone number
            resendOtp(payload.phone).catch(error => {
              console.error('Error sending OTP to existing phone:', error);
              setError('Failed to send verification code. Please try resending.');
            });
          } else {
            // No phone in token, user needs to add phone number
            console.log('🔍 VerificationForm - No phone in token, user needs to add phone');
            setNeedsPhoneNumber(true);
            setPhoneNumber(''); // Will show phone input form
          }
        } catch (error) {
          console.error('Error getting phone from token:', error);
          setNeedsPhoneNumber(true);
          setPhoneNumber(''); // Let user add phone number
        }
      } else {
        // No token, redirect to signup
        router.push("/signup");
      }
    }
  }, [searchParams, router, resendOtp]);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;

    const newOtpDigits = [...otpDigits];

    // If backspace is pressed (indicated by an empty value)
    if (value === "") {
      newOtpDigits[index] = "";
      setOtpDigits(newOtpDigits);

      // Focus previous input if available
      if (index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    } else {
      // Extract just the last character if multiple characters are pasted
      const singleDigit = value.slice(-1);
      newOtpDigits[index] = singleDigit;
      setOtpDigits(newOtpDigits);

      // Auto-focus next input if available
      if (index < 5 && singleDigit) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  // Handle key press (for backspace navigation)
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // If backspace is pressed and current input is empty, focus previous input
    if (e.key === "Backspace" && otpDigits[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle OTP verification
  const { verify } = useAuth();

  const handleVerifyOtp = async () => {
    const otpCode = otpDigits.join("");

    if (otpCode.length !== 6) {
      setError("Please enter a complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure phone number is in a clean format before sending to backend
      // Just pass it as-is - backend will handle proper formatting
      const response = await verify(phoneNumber, otpCode);

      // On successful verification, redirect to home or dashboard
      if (response && response.data === true) {
        // Add a small delay to allow the auth context to update
        // from the user data fetched in the verification process
        setTimeout(() => {
          router.push("/");
        }, 100);
      } else {
        throw new Error("Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle phone number submission for users without phone
  const handleSubmitPhoneNumber = async () => {
    if (!tempPhoneInput.trim()) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the new addPhoneNumber endpoint for OAuth users without phone numbers
      await AuthService.addPhoneNumber(tempPhoneInput);
      
      // If successful, set the phone number and switch to OTP mode
      setPhoneNumber(tempPhoneInput);
      setNeedsPhoneNumber(false);
      setTempPhoneInput("");
    } catch (err) {
      console.error("Error submitting phone number:", err);
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP code
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResendOtp = async () => {
    if (!phoneNumber) {
      setResendError("Phone number is missing. Please try again.");
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      // Call the resend OTP method from auth context
      await resendOtp(phoneNumber);
      
      // Show success message
      setResendSuccess(true);
    } catch (err) {
      console.error("Error resending OTP:", err);
      setResendError(err instanceof Error ? err.message : "Failed to resend verification code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {needsPhoneNumber ? "Add your phone number" : "Verify your phone number"}
          </CardTitle>
          <CardDescription>
            {needsPhoneNumber 
              ? "Please enter your phone number to receive a verification code"
              : `Enter the 6-digit code sent to ${phoneNumber}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {error}
              {error?.includes("invalid") || error?.includes("Invalid") ? 
                <p className="mt-1 text-xs">Please check your SMS and try again with the exact code.</p> : null
              }
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-100 text-green-800 text-sm p-3 rounded-md mb-4">
              Verification code has been resent. Please check your SMS.
            </div>
          )}

          {resendError && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
              {resendError}
            </div>
          )}

          {needsPhoneNumber ? (
            // Phone number input form
            <div className="space-y-4">
              <div>
                <Input
                  type="tel"
                  placeholder="Enter your phone number (e.g., +1234567890)"
                  value={tempPhoneInput}
                  onChange={(e) => setTempPhoneInput(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleSubmitPhoneNumber}
                className="w-full"
                disabled={isLoading || !tempPhoneInput.trim()}
              >
                {isLoading ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </div>
          ) : (
            // OTP verification form
            <>
              <div className="flex justify-center mb-6">
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      className="w-12 text-center text-xl"
                      maxLength={1}
                      value={otpDigits[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            </>
          )}
        </CardContent>
        {!needsPhoneNumber && (
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center">
              {`Didn't receive the code?`}{" "}
              <button
                onClick={handleResendOtp}
                className="text-primary underline underline-offset-4"
                type="button"
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend"}
              </button>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
