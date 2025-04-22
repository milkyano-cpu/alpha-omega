"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface BookingDetails {
  id: number;
  service: string;
  date: string;
  time: string;
  deposit: string;
  total: string;
  status: string;
}

export default function ThankYou() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Get the booking details from localStorage
    const lastBookingStr = localStorage.getItem("lastBooking");
    if (lastBookingStr) {
      try {
        const lastBooking = JSON.parse(lastBookingStr) as BookingDetails;
        setBookingDetails(lastBooking);
      } catch (err) {
        console.error("Error parsing booking details:", err);
      }
    }

    // Clear the booking details after we've loaded them
    // to prevent showing old booking details on page refresh
    return () => {
      localStorage.removeItem("lastBooking");
    };
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
            Thank you for choosing Alpha Omega, {user?.first_name}. Your appointment has been
            successfully booked!
          </p>

          {bookingDetails && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-left">
              <h2 className="font-bold text-xl mb-2 text-center">Booking Details</h2>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-600">Service:</p>
                <p className="font-medium">{bookingDetails.service}</p>
                
                <p className="text-gray-600">Date:</p>
                <p className="font-medium">{bookingDetails.date}</p>
                
                <p className="text-gray-600">Time:</p>
                <p className="font-medium">{bookingDetails.time}</p>
                
                <p className="text-gray-600">Deposit Paid:</p>
                <p className="font-medium">${bookingDetails.deposit} AUD</p>
                
                <p className="text-gray-600">Total Price:</p>
                <p className="font-medium">${bookingDetails.total} AUD</p>
                
                <p className="text-gray-600">Balance Due:</p>
                <p className="font-medium">${(parseFloat(bookingDetails.total) - parseFloat(bookingDetails.deposit)).toFixed(2)} AUD</p>
                
                <p className="text-gray-600">Booking Status:</p>
                <p className="font-medium capitalize">{bookingDetails.status}</p>
              </div>
            </div>
          )}

          <p className="mb-8 text-gray-600">
            You will receive a confirmation email with the details of your
            appointment. Please arrive 10 minutes before your scheduled time.
            <br/><br/>
            <strong>Remember:</strong> Please pay the remaining balance at the barbershop.
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
