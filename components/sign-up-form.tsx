"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import { isPossiblePhoneNumber } from "react-phone-number-input";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth-context";

// Define the schema for form validation
const signUpSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  nickname: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  phone_number: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine((value) => value.startsWith("+ ") || value.startsWith("+"), {
      message: "Phone number must start with a country code (e.g., +61)",
    })
    .refine(
      (value) => {
        try {
          // Clean up the value for validation
          const cleaned = value.replace(/\s+/g, "");

          // Check for valid international format
          if (cleaned.length < 8) return false;

          // Simple pattern check: +countryCode(digits)
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
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Birthday must be in the format YYYY-MM-DD",
  }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [, setPhoneNumber] = useState("+61"); // Default to Australia
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      nickname: "",
      email: "",
      password: "",
      phone_number: "+61", // Default to Australia
      birthday: "",
    },
  });

  const { register } = useAuth();

  // Check for data from main form on home page
  useEffect(() => {
    const quickSignupData = sessionStorage.getItem("quickSignupData");
    if (quickSignupData) {
      try {
        const data = JSON.parse(quickSignupData);
        // Pre-fill the form with data from main form
        form.setValue("first_name", data.first_name || "");
        form.setValue("last_name", data.last_name || "");
        form.setValue("email", data.email || "");
        form.setValue("password", data.password || "");
        // Clear the data after using it
        sessionStorage.removeItem("quickSignupData");
      } catch (error) {
        console.error("Error parsing quick signup data:", error);
      }
    }
  }, [form]);

  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Use the phone number directly - it should already be in the correct format
      const formattedValues = { ...values };

      // Register the user
      await register(formattedValues);

      // Always redirect to verify page - user will be redirected to home after verification
      setTimeout(() => {
        // Use router.push with the replace option to force a navigation
        router.push(
          `/verify?phone=${encodeURIComponent(formattedValues.phone_number)}`
        );
      }, 100);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Enter your information to sign up</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">First Name</FormLabel>
                      <FormControl>
                      <Input placeholder="John" className="h-11 px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                      <FormControl>
                      <Input placeholder="Doe" className="h-11 px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nickname (Optional)</FormLabel>
                    <FormControl>
                    <Input placeholder="Johnny" className="h-11 px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                    <Input
                    type="email"
                    placeholder="your.email@example.com"
                    className="h-11 px-4"
                      {...field}
                  />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <div className="relative">
                    <FormControl>
                    <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 px-4"
                      {...field}
                    />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                    <FormControl>
                    <div className="phone-input-container">
                        <PhoneInput
                          defaultCountry="AU"
                          international
                          value={field.value}
                          onChange={(value) => {
                            // Ensure value is always a string with country code
                            const formattedValue = value || "+61";
                            field.onChange(formattedValue);
                            setPhoneNumber(formattedValue);
                          }}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                          placeholder="+61 412 123 456"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Birthday</FormLabel>
                    <FormControl>
                    <Input
                    type="date"
                    className="h-11 px-4"
                    {...field}
                    onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-11 font-medium text-base bg-black hover:bg-black/90 text-white rounded-md transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating account...</span>
                  </span>
                ) : (
                  "Sign Up"
                )}
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 font-medium underline-offset-4 hover:underline">
                  Log in
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking Sign Up, you agree to our <a href="#" className="text-blue-600 hover:underline underline-offset-4">Terms of Service</a>{" "}
        and <a href="#" className="text-blue-600 hover:underline underline-offset-4">Privacy Policy</a>.
      </div>
    </div>
  );
}
