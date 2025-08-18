"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ForgotPasswordModal } from "@/components/forgot-password-modal";
import GoogleOAuthButton from "@/components/oauth/GoogleOAuthButton";
import AppleOAuthButton from "@/components/oauth/AppleOAuthButton";
import { PhoneNumberModal } from "@/components/oauth/PhoneNumberModal";

// Define the schema for form validation
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [oauthProfile, setOauthProfile] = useState<any>(null);
  const [oauthIdToken, setOauthIdToken] = useState<string>("");
  const [oauthProvider, setOauthProvider] = useState<"google" | "apple">("google");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get('returnUrl') || null;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { login } = useAuth();

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await login(values.email, values.password, values.rememberMe);

      // Redirect back to the page the user was trying to access, or homepage if none specified
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  }

  const handleOAuthSuccess = () => {
    // Redirect after successful OAuth login
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      router.push("/");
    }
  };

  const handleOAuthError = (error: string) => {
    setError(error);
  };

  const handleNeedPhoneNumber = (profile: any, idToken: string, provider: "google" | "apple") => {
    setOauthProfile(profile);
    setOauthIdToken(idToken);
    setOauthProvider(provider);
    setShowPhoneModal(true);
  };

  const handlePhoneModalSuccess = () => {
    setShowPhoneModal(false);
    handleOAuthSuccess();
  };

  const handlePhoneModalClose = () => {
    setShowPhoneModal(false);
    setOauthProfile(null);
    setOauthIdToken("");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}

                {/* OAuth Buttons */}
                <div className="grid gap-3">
                  <GoogleOAuthButton
                    onSuccess={handleOAuthSuccess}
                    onError={handleOAuthError}
                    onNeedPhoneNumber={(profile, idToken) => 
                      handleNeedPhoneNumber(profile, idToken, "google")
                    }
                  />
                  <AppleOAuthButton
                    onSuccess={handleOAuthSuccess}
                    onError={handleOAuthError}
                    onNeedPhoneNumber={(profile, idToken) => 
                      handleNeedPhoneNumber(profile, idToken, "apple")
                    }
                  />
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid gap-6">
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
                        <div className="flex items-center">
                          <FormLabel className="text-sm font-medium">Password</FormLabel>
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            className="ml-auto text-sm text-blue-600 underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </button>
                        </div>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-11 px-4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Remember me for 30 days
                          </FormLabel>
                        </div>
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
                        <span>Logging in...</span>
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <a href="/signup" className="text-blue-600 font-medium underline-offset-4 hover:underline">
                    Sign up now
                  </a>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking Sign In, you agree to our <a href="#" className="text-blue-600 hover:underline underline-offset-4">Terms of Service</a>{" "}
        and <a href="#" className="text-blue-600 hover:underline underline-offset-4">Privacy Policy</a>.
      </div>
      
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={() => {
          // Clear any existing error and show success message
          setError(null);
        }}
      />

      <PhoneNumberModal
        isOpen={showPhoneModal}
        onClose={handlePhoneModalClose}
        profile={oauthProfile}
        idToken={oauthIdToken}
        provider={oauthProvider}
        onSuccess={handlePhoneModalSuccess}
        onError={handleOAuthError}
      />
    </div>
  );
}
