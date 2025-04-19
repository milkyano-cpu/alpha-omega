"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ThankYou() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // In a real application, you might fetch the latest booking from the API
    // For now, we'll just show a generic thank you message
  }, [isAuthenticated, router]);

  return (
    <main className="flex flex-col gap-20 mt-30">
      <section className="container mx-auto flex flex-col items-center justify-center text-center py-20 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>

          <p className="text-lg mb-6">
            Thank you for choosing Alpha Omega. Your appointment has been
            successfully booked!
          </p>

          <p className="mb-8 text-gray-600">
            You will receive a confirmation email with the details of your
            appointment. Please arrive 10 minutes before your scheduled time.
          </p>

          <div className="flex flex-col gap-4">
            <Button
              onClick={() => router.push("/book/services")}
              variant="outline"
              className="w-full"
            >
              Book Another Appointment
            </Button>

            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
