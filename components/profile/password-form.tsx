"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthService, User } from "@/lib/auth-service";

interface PasswordFormProps {
  user: User;
}

export function PasswordForm({ user }: PasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user has OAuth accounts (no password)
  const isOAuthUser = !user.password;

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      if (isOAuthUser) {
        // Create password for OAuth users
        await AuthService.createPassword({
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword
        });
        setSuccess("Password created successfully! You can now login with email and password.");
      } else {
        // Update password for existing users
        await AuthService.updatePassword({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword
        });
        setSuccess("Password updated successfully!");
      }

      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Type Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Type</CardTitle>
        </CardHeader>
        <CardContent>
          {isOAuthUser ? (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">OAuth Account</p>
                <p className="text-sm text-gray-600">
                  You signed up using Google or Apple. You can create a password below to enable email/password login.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Standard Account</p>
                <p className="text-sm text-gray-600">
                  You can login with email and password. Update your password below.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {!isOAuthUser && (
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
              placeholder="Enter your current password"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="newPassword">
            {isOAuthUser ? "Create Password" : "New Password"}
          </Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleInputChange}
            required
            placeholder="Enter your new password"
          />
          <p className="text-xs text-gray-500">
            Password must be at least 8 characters long
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            placeholder="Confirm your new password"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="min-w-32">
            {isLoading 
              ? (isOAuthUser ? "Creating..." : "Updating...") 
              : (isOAuthUser ? "Create Password" : "Update Password")
            }
          </Button>
        </div>
      </form>
    </div>
  );
}