"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const phone = searchParams.get("phone");
    if (phone) {
      // Use the phone number as-is - our backend will handle formatting
      setPhoneNumber(phone);
    } else {
      // If no phone number is provided, redirect back to signup
      router.push("/signup");
    }
  }, [searchParams, router]);

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

  // Handle resend OTP code
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const { resendOtp } = useAuth();

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
          <CardTitle className="text-2xl">Verify your phone number</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {phoneNumber}
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
        </CardContent>
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
      </Card>
    </div>
  );
}
