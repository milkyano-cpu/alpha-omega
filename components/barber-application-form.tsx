"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import { isPossiblePhoneNumber } from "react-phone-number-input";
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
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine((value) => value.startsWith("+ ") || value.startsWith("+"), {
      message: "Please select a country code",
    })
    .refine(
      (value) => {
        if (!value || value === "+") return false;
        return isPossiblePhoneNumber(value);
      },
      { message: "Please enter a valid phone number" },
    ),
  experience: z
    .string()
    .min(1, { message: "Please describe your experience" })
    .max(500, { message: "Experience must not exceed 500 characters" }),
  specializations: z
    .string()
    .min(1, { message: "Please list your specializations" })
    .max(300, { message: "Specializations must not exceed 300 characters" }),
  availability: z
    .string()
    .min(1, { message: "Please specify your availability" })
    .max(200, { message: "Availability must not exceed 200 characters" }),
  portfolio: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Please enter a valid URL" },
    ),
});

export function BarberApplicationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      experience: "",
      specializations: "",
      availability: "",
      portfolio: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      // Here you would typically send the application to your backend
      console.log("Barber application submitted:", values);

      // For now, just show success
      alert("Thank you for your application! We'll be in touch soon.");

      // Reset form
      form.reset();
    } catch {
      setError("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Join Our Team</h2>
        <p className="text-gray-600 mt-2">
          Apply to become a barber at Alpha Omega
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john.doe@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    international
                    defaultCountry="AU"
                    placeholder="+61 03 9012 5480"
                    value={field.value}
                    onChange={(value) => field.onChange(value || "")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Tell us about your barbering experience..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specializations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specializations</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Fades, Beard styling, Classic cuts..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Full-time, Part-time, Weekends..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="portfolio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Portfolio URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://instagram.com/yourprofile"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Application"}
          </Button>

          <p className="text-xs text-center text-gray-500">
            By submitting, you agree to our{" "}
            <a href="#" className="underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>
          </p>
        </form>
      </Form>
    </div>
  );
}
