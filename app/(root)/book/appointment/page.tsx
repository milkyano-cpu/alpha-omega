"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

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

interface Availability {
  start_at: string;
  location_id: string;
  appointment_segments: {
    duration_minutes: number;
    service_variation_id: string;
    team_member_id: string;
    service_variation_version: number;
  }[];
}

export default function AppointmentBooking() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableTimes, setAvailableTimes] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Availability | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

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

        // Call API to get availability for selected service and date
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/services/availability/search`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              service_variation_id: selectedService.service_variation_id,
              start_at: startDate.toISOString(),
              end_at: endDate.toISOString(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data = await response.json();
        const availabilities =
          data.data?.availabilities_by_date?.[
            startDate.toISOString().split("T")[0]
          ] || [];
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

  const handleTimeSelection = (time: Availability) => {
    setSelectedTime(time);
  };

  const handleBookingConfirmation = async () => {
    if (!selectedService || !selectedTime || !user) {
      setError("Please select a service, date, and time");
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

      // Create booking in API
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        }/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            service_variation_id: selectedService.service_variation_id,
            team_member_id: selectedService.team_member_id.toString(),
            start_at: selectedTime.start_at,
            service_variation_version: serviceVariationVersion,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }

      // Booking successful, clear localStorage
      localStorage.removeItem("selectedService");
      localStorage.removeItem("selectedBarberId");

      // Redirect to confirmation page or home
      router.push("/book/thank-you");
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

  if (!selectedService) {
    return (
      <main className="flex flex-col gap-20 mt-20">
        <section className="container mx-auto text-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading service information...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-20 mt-20">
      <section className="flex flex-col md:flex-row gap-8 py-20 justify-center px-4">
        <div className="w-full md:w-auto">
          <BookingCalendar
            selectedDate={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="flex flex-col w-full md:w-80">
          <b>APPOINTMENT SUMMARY</b>

          <div className="flex flex-col border border-black rounded-xl mt-4">
            <div className="flex flex-col gap-4 p-4 border-b border-black">
              <p>{selectedService.name}</p>
              <div className="flex gap-8">
                <sub>
                  ${(selectedService.price_amount / 100).toFixed(2)}{" "}
                  {selectedService.price_currency}
                </sub>
                <sub>{selectedService.duration} Mins</sub>
              </div>
            </div>

            <div className="flex justify-between p-4">
              <p>{selectedService.name}</p>
              <sub>${(selectedService.price_amount / 100).toFixed(2)}</sub>
            </div>
          </div>

          {selectedTime && (
            <div className="mt-4 p-4 border border-green-500 rounded-xl bg-green-50">
              <p className="font-bold">Selected Time:</p>
              <p>{formatTime(selectedTime.start_at)}</p>
              <p>
                {new Date(selectedTime.start_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 border border-red-400 bg-red-50 rounded-xl text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleBookingConfirmation}
            disabled={!selectedTime || creating}
            className="mt-6"
          >
            {creating ? "Creating Booking..." : "Confirm Booking"}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-8 container mx-auto mb-40 px-4">
        <h2 className="text-xl font-bold">Available Times</h2>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2">Loading available times...</p>
          </div>
        ) : availableTimes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableTimes.map((time, index) => (
              <Button
                key={index}
                className={`rounded-md px-4 py-2 text-base ${
                  selectedTime?.start_at === time.start_at ? "bg-green-600" : ""
                }`}
                onClick={() => handleTimeSelection(time)}
              >
                {formatTime(time.start_at)}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-center py-10">
            No available times for the selected date. Please try another date.
          </p>
        )}
      </section>
    </main>
  );
}
