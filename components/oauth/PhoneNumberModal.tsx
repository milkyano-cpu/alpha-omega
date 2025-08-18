"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

interface PhoneNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  idToken: string;
  provider: "google" | "apple";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PhoneNumberModal({
  isOpen,
  onClose,
  profile,
  idToken,
  provider,
  onSuccess,
  onError,
}: PhoneNumberModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { completeGoogleAuth, completeAppleAuth } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      onError?.("Please enter a phone number");
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (provider === "google") {
        result = await completeGoogleAuth(idToken, phoneNumber);
      } else {
        result = await completeAppleAuth(idToken, phoneNumber);
      }
      
      // Close the modal first
      onClose();
      
      // Check if we got a verification_sid (which means OTP was sent)
      if (result?.data?.verification_sid) {
        // Redirect to verification page with the phone number
        router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
      } else {
        // If no verification needed (shouldn't happen for new users), complete the flow
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("OAuth completion error:", error);
      onError?.(
        error.response?.data?.error || 
        `Failed to complete ${provider} authentication`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Complete Your Registration</DialogTitle>
          <DialogDescription className="text-gray-600 leading-relaxed">
            Welcome {profile?.firstName}! Please provide your phone number to complete your account setup.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="w-full h-11 px-4"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="px-6"
            >
              {isLoading ? "Completing..." : "Complete Registration"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}