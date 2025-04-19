"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BookingService, TimeSlot } from "@/lib/booking-service";

interface Service {
  id: number;
  team_member_id: number;
  name: string;
  description: string;
  price_amount: number;
  price_currency: string;
  duration: number;
  service_variation_id: string;
  square_catalog_id: string;
}

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [, setBookingId] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Handle payment process
  const handlePayment = (e: React.MouseEvent) => {
    e.preventDefault();

    // Open payment link in a popup
    window.open(
      "https://square.link/u/K0DxFxCJ?src=embed",
      "Square Payment",
      "width=500,height=600,scrollbars=yes"
    );

    // Simulate successful payment after a short delay
    setTimeout(() => {
      setPaymentCompleted(true);
    }, 1000);
  };

  // Load selected service from localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/book/services");
      return;
    }

    const serviceData = localStorage.getItem("selectedService");
    if (!serviceData) {
      // No service selected, redirect back to services page
      router.push("/book/services");
      return;
    }

    try {
      const parsedService = JSON.parse(serviceData) as Service;
      setSelectedService(parsedService);
    } catch (err) {
      console.error("Error parsing selected service:", err);
      router.push("/book/services");
    }
  }, [isAuthenticated, router]);

  // Fetch available times when date changes
  useEffect(() => {
    if (!selectedService) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Format date for API request
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        // Use BookingService to get availability
        const availabilityData = await BookingService.searchAvailability(
          selectedService.service_variation_id,
          startDate,
          endDate
        );

        // Get time slots for the selected date
        const dateKey = startDate.toISOString().split("T")[0];
        const availabilities =
          availabilityData.availabilities_by_date[dateKey] || [];

        // Sort times chronologically for better UX
        availabilities.sort(
          (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        );

        setAvailableTimes(availabilities);
      } catch (err) {
        console.error("Error fetching availability:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load available times"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, selectedService]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset selected time when date changes
  };

  const handleTimeSelection = (time: TimeSlot) => {
    setSelectedTime(time);
  };

  // Function to handle booking confirmation after payment
  const handleBookingConfirmation = async () => {
    if (!selectedService || !selectedTime || !user || !paymentCompleted) {
      setError("Please complete payment first");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Get service variation version from the appointment segments
      const serviceVariationVersion =
        selectedTime.appointment_segments?.[0]?.service_variation_version;
      console.log(
        "Booking with service variation version:",
        serviceVariationVersion
      );

      // Use BookingService to create booking
      const bookingData = await BookingService.createBooking({
        service_variation_id: selectedService.service_variation_id,
        team_member_id: selectedService.team_member_id.toString(),
        start_at: selectedTime.start_at,
        service_variation_version: serviceVariationVersion,
      });

      console.log("Booking created:", bookingData);

      // Set booking as confirmed and store the ID
      setBookingConfirmed(true);
      if (bookingData?.data?.id) {
        setBookingId(bookingData.data.id.toString());
      }

      // After a brief delay, redirect to thank you page
      setTimeout(() => {
        // Clear localStorage
        localStorage.removeItem("selectedService");
        localStorage.removeItem("selectedBarberId");

        // Redirect to confirmation page
        router.push("/book/thank-you");
      }, 2000);
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setCreating(false);
    }
  };

  // Format time for display
  const formatTime = (isoTime: string) => {
    const time = new Date(isoTime);
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Render booking summary section - more compact version
  const renderBookingSummary = () => {
    if (!selectedService) return null;

    return (
      <div className="mb-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <p className="text-sm font-medium">{selectedService.name}</p>
            <div className="flex gap-3 text-xs text-gray-600">
              <span>${(selectedService.price_amount / 100).toFixed(2)}</span>
              <span>
                {selectedService.duration > 10000
                  ? Math.round(selectedService.duration / 60000)
                  : selectedService.duration}{" "}
                min
              </span>
            </div>
          </div>
          <div className="p-3 flex justify-between items-center">
            <p className="text-sm">Total</p>
            <p className="font-medium">
              ${(selectedService.price_amount / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {selectedTime && (
          <div className="mt-3 p-3 border border-green-500 rounded-lg bg-green-50">
            <p className="font-medium text-sm mb-1">Selected Time:</p>
            <div className="flex justify-between items-center">
              <p className="text-lg font-medium">
                {formatTime(selectedTime.start_at)}
              </p>
              <p className="text-base font-bold">
                {new Date(selectedTime.start_at).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 border border-red-400 bg-red-50 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  };

  // Render payment section
  const renderPaymentSection = () => {
    if (bookingConfirmed) {
      return (
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg mb-3 text-sm">
          <p className="text-green-800 font-medium">
            Booking confirmed! You&apos;ll be redirected shortly.
          </p>
        </div>
      );
    }

    if (paymentCompleted) {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-sm">
            <p className="text-green-800 font-medium">
              Payment completed! Please confirm your booking.
            </p>
          </div>
          <Button
            onClick={handleBookingConfirmation}
            disabled={creating}
            className="w-full py-2 text-base font-medium"
          >
            {creating ? "Creating Booking..." : "Confirm Booking"}
          </Button>
        </div>
      );
    }

    if (selectedTime) {
      return (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <p className="p-3 font-medium text-base border-b border-gray-100 bg-gray-50">
            Payment
          </p>
          <div className="p-5">
            <p className="text-xl font-medium mb-4">
              $
              {selectedService
                ? (selectedService.price_amount / 100).toFixed(2)
                : "0.00"}{" "}
              AUD
            </p>
            <Button
              className="w-full py-3 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-md font-normal"
              onClick={handlePayment}
            >
              Pay now
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render available times section
  const renderAvailableTimes = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-sm">Loading available times...</p>
        </div>
      );
    }

    if (availableTimes.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-3 text-center text-sm">
          <p>
            No available times for the selected date. Please try another date.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-4">
        {availableTimes.map((time, index) => (
          <Button
            key={index}
            variant={
              selectedTime?.start_at === time.start_at ? "default" : "outline"
            }
            className={`min-w-[100px] rounded-md py-2.5 px-4 text-sm ${
              selectedTime?.start_at === time.start_at
                ? "bg-black text-white"
                : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100"
            }`}
            onClick={() => handleTimeSelection(time)}
          >
            {formatTime(time.start_at)}
          </Button>
        ))}
      </div>
    );
  };

  if (!selectedService) {
    return (
      <main className="flex flex-col gap-3 mt-20">
        <section className="container mx-auto text-center py-16">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading service information...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 mt-30 mb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Calendar and time selection */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-base font-semibold mb-3">
              Please select a date and time
            </h2>
            <BookingCalendar
              selectedDate={selectedDate}
              onChange={handleDateChange}
            />

            {/* Available times section */}
            <div className="mt-5">
              <h3 className="text-base font-semibold mb-3">Available Times</h3>
              {renderAvailableTimes()}
            </div>
          </div>

          {/* Right column - Booking summary and payment */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-base font-semibold mb-3">SUMMARY</h2>
            {renderBookingSummary()}
            {renderPaymentSection()}
          </div>
        </div>
      </div>
    </main>
  );
}
