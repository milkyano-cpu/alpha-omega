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
  const handleResendOtp = async () => {
    // Add your resend OTP logic here
    // You should have an API endpoint for this
    alert("Resend OTP functionality would go here");
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
            >
              Resend
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
