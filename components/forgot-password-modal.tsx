"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { API } from "@/lib/api-client";

// Phone number schema - accepting Australian format
const phoneSchema = z.object({
  phone_number: z.string()
    .min(1, { message: "Phone number is required" })
    .regex(/^(\+61|0)[2-9]\d{8}$/, { 
      message: "Please enter a valid Australian phone number (e.g., 0412345678 or +61412345678)" 
    }),
});

// OTP verification schema
const otpSchema = z.object({
  otp_code: z.string()
    .length(6, { message: "OTP code must be 6 digits" })
    .regex(/^\d{6}$/, { message: "OTP code must contain only numbers" }),
});

// New password schema
const passwordSchema = z.object({
  new_password: z.string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don&apos;t match",
  path: ["confirm_password"],
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'phone' | 'otp' | 'password' | 'success';

export function ForgotPasswordModal({ isOpen, onClose, onSuccess }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone_number: "" },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp_code: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const resetForms = () => {
    phoneForm.reset();
    otpForm.reset();
    passwordForm.reset();
    setStep('phone');
    setError(null);
    setPhoneNumber('');
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  async function onPhoneSubmit(values: PhoneFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await API.post('/auth/forgot-password', { phone_number: values.phone_number });
      setPhoneNumber(values.phone_number);
      setStep('otp');
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(err?.message || "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  }

  async function onOtpSubmit() {
    setStep('password');
  }

  async function onPasswordSubmit(values: PasswordFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const otpCode = otpForm.getValues().otp_code;
      await API.post('/auth/reset-password', {
        phone_number: phoneNumber,
        otp_code: otpCode,
        new_password: values.new_password,
      });

      setStep('success');
      
      // Auto close after 2 seconds and call success callback
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  }

  const renderPhoneStep = () => (
    <Form {...phoneForm}>
      <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-6">
        <FormField
          control={phoneForm.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="0412345678"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Sending..." : "Send Code"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderOtpStep = () => (
    <Form {...otpForm}>
      <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
        <div className="text-sm text-gray-600 text-center">
          We&apos;ve sent a 6-digit code to {phoneNumber}
        </div>
        
        <FormField
          control={otpForm.control}
          name="otp_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('phone')}
            className="flex-1"
          >
            Back
          </Button>
          <Button type="submit" className="flex-1">
            Verify Code
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderPasswordStep = () => (
    <Form {...passwordForm}>
      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
        <FormField
          control={passwordForm.control}
          name="new_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={passwordForm.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('otp')}
            className="flex-1"
          >
            Back
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Password Reset Complete!</h3>
        <p className="text-sm text-gray-600 mt-2">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case 'phone': return 'Reset Password';
      case 'otp': return 'Verify Code';
      case 'password': return 'Set New Password';
      case 'success': return 'Success!';
      default: return 'Reset Password';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'phone': return 'Enter your phone number to receive a verification code';
      case 'otp': return 'Enter the 6-digit code sent to your phone';
      case 'password': return 'Choose a new password for your account';
      case 'success': return '';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {getDescription() && (
            <DialogDescription>{getDescription()}</DialogDescription>
          )}
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          {step === 'phone' && renderPhoneStep()}
          {step === 'otp' && renderOtpStep()}
          {step === 'password' && renderPasswordStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}