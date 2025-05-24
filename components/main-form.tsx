"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import { useAuth } from "@/lib/auth-context";
import "@/styles/phone-input.css";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must not exceed 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "First name can only contain letters" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name must not exceed 50 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Last name can only contain letters" }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .toLowerCase(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine((value) => value.startsWith("+ ") || value.startsWith("+"), {
      message: "Phone number must start with a country code (e.g., +61)",
    })
    .refine(
      (value) => {
        try {
          const cleaned = value.replace(/\s+/g, "");
          if (cleaned.length < 8) return false;
          return (
            /^\+[1-9]\d{6,14}$/.test(cleaned) || isPossiblePhoneNumber(value)
          );
        } catch (error) {
          console.log("Phone validation error:", error);
          return false;
        }
      },
      {
        message: "Please enter a valid phone number with country code",
      }
    ),
});

type FormData = z.infer<typeof formSchema>;

export function MainForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "+61",
    },
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare registration data with all required fields
      const registrationData = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        password: values.password,
        phone_number: values.phoneNumber,
        // These fields are still required by the API but we'll set defaults
        birthday: "",
        nickname: "",
      };
      
      // Since we have all required fields except birthday, we can register directly
      await register(registrationData);
      
      // Redirect to verify page after successful registration
      setTimeout(() => {
        router.push(
          `/verify?phone=${encodeURIComponent(registrationData.phone_number)}`
        );
      }, 100);
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Get Started Today
        </h2>
        <p className="text-gray-600">
          Create your account to book your first appointment
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John" 
                      className="h-11 px-4 border-gray-300 focus:border-black focus:ring-black"
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Doe" 
                      className="h-11 px-4 border-gray-300 focus:border-black focus:ring-black"
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="john.doe@example.com" 
                    className="h-11 px-4 border-gray-300 focus:border-black focus:ring-black"
                    disabled={isSubmitting}
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Password
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-11 px-4 pr-12 border-gray-300 focus:border-black focus:ring-black"
                      disabled={isSubmitting}
                      {...field} 
                    />
                  </FormControl>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <div className="phone-input-container">
                    <PhoneInput
                      defaultCountry="AU"
                      international
                      value={field.value}
                      onChange={(value) => {
                        const formattedValue = value || "+61";
                        field.onChange(formattedValue);
                      }}
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="+61 412 123 456"
                      disabled={isSubmitting}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 rounded-full bg-black hover:bg-gray-800 text-white font-medium transition-colors duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
          
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-black hover:underline font-medium">
                Log in
              </a>
            </p>
            
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <a href="#" className="text-black hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-black hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
