"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthService, User } from "@/lib/auth-service";
import { useAuth } from "@/lib/auth-context";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    nickname: user.nickname || "",
    email: user.email || "",
    phone_number: user.phone_number || "",
    birthday: user.birthday ? user.birthday.split('T')[0] : "", // Format for input[type="date"]
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

    try {
      const response = await AuthService.updateProfile(formData);
      
      // Update user in auth context
      if (response.data && response.data.user) {
        setUser(response.data.user);
        // Also update localStorage
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            name="nickname"
            type="text"
            value={formData.nickname}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled // Email shouldn't be changed easily
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            Contact support to change your email address
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleInputChange}
            required
          />
          <p className="text-xs text-gray-500">
            Changing your phone number will require re-verification
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthday">Birthday</Label>
          <Input
            id="birthday"
            name="birthday"
            type="date"
            value={formData.birthday}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="min-w-32">
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </div>
    </form>
  );
}