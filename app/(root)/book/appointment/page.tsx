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
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Square payment checkout script
  useEffect(() => {
    // Only add the script if it doesn't already exist
    if (typeof window !== "undefined") {
      const handleCheckoutClick = (e: MouseEvent) => {
        e.preventDefault();

        const button = e.currentTarget as HTMLAnchorElement;
        const url = button.getAttribute("data-url");
        const title = "Square Payment Links";

        // Some platforms embed in an iframe, so we want to top window to calculate sizes correctly
        const topWindow = window.top ? window.top : window;

        // Fixes dual-screen position                             Most browsers      Firefox
        const dualScreenLeft =
          topWindow.screenLeft !== undefined
            ? topWindow.screenLeft
            : window.screenX;
        const dualScreenTop =
          topWindow.screenTop !== undefined
            ? topWindow.screenTop
            : window.screenY;

        const width = topWindow.innerWidth
          ? topWindow.innerWidth
          : document.documentElement.clientWidth
          ? document.documentElement.clientWidth
          : screen.width;
        const height = topWindow.innerHeight
          ? topWindow.innerHeight
          : document.documentElement.clientHeight
          ? document.documentElement.clientHeight
          : screen.height;

        const h = height * 0.75;
        const w = 500;

        const systemZoom = width / window.screen.availWidth;
        const left = (width - w) / 2 / systemZoom + dualScreenLeft;
        const top = (height - h) / 2 / systemZoom + dualScreenTop;

        if (url) {
          const newWindow = window.open(
            url,
            title,
            `scrollbars=yes, width=${w / systemZoom}, height=${
              h / systemZoom
            }, top=${top}, left=${left}`
          );
          if (newWindow && window.focus) newWindow.focus();
        }
      };

      // Add click event listener after component mounts
      setTimeout(() => {
        const checkoutButton = document.getElementById(
          "embedded-checkout-modal-checkout-button"
        );
        if (checkoutButton) {
          checkoutButton.addEventListener("click", handleCheckoutClick as any);
        }
      }, 1000);

      // Clean up event listener when component unmounts
      return () => {
        const checkoutButton = document.getElementById(
          "embedded-checkout-modal-checkout-button"
        );
        if (checkoutButton) {
          checkoutButton.removeEventListener(
            "click",
            handleCheckoutClick as any
          );
        }
      };
    }
  }, [selectedTime, paymentCompleted]); // Re-run when selectedTime or payment completion changes

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

      // Parse the response to get booking details
      const bookingData = await response.json();
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

  if (!selectedService) {
    return (
      <main className="flex flex-col gap-3 mt-3">
        <section className="container mx-auto text-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading service information...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-3 mt-25">
      <section className="flex flex-col md:flex-row gap-6 py-4 justify-center px-4">
        <div className="w-full md:w-1/2 lg:w-5/12">
          <h2 className="text-lg font-semibold mb-3 text-center">
            Please select a date and time
          </h2>
          <BookingCalendar
            selectedDate={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        <div className="flex flex-col w-full md:w-1/2 lg:w-5/12">
          <div className="md:mt-6">
            <h2 className="text-lg font-bold mb-2">SUMMARY</h2>
          </div>

          <div className="flex flex-col border border-black rounded-xl mt-2">
            <div className="flex flex-col gap-4 p-4 border-b border-black">
              <p>{selectedService.name}</p>
              <div className="flex gap-8">
                <sub>
                  ${(selectedService.price_amount / 100).toFixed(2)}{" "}
                  {selectedService.price_currency}
                </sub>
                <sub>
                  {selectedService.duration > 10000
                    ? Math.round(selectedService.duration / 60000)
                    : selectedService.duration}{" "}
                  Mins
                </sub>
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

          <div className="mt-6 space-y-4">
            {paymentCompleted ? (
              <>
                {!bookingConfirmed ? (
                  <>
                    <div className="p-3 bg-green-100 border border-green-300 rounded-md mb-4">
                      <p className="text-green-800 font-medium">
                        Payment completed! Please confirm your booking.
                      </p>
                    </div>
                    <Button
                      onClick={handleBookingConfirmation}
                      disabled={creating}
                      className="w-full"
                    >
                      {creating ? "Creating Booking..." : "Confirm Booking"}
                    </Button>
                  </>
                ) : (
                  <div className="p-3 bg-green-100 border border-green-300 rounded-md mb-4">
                    <p className="text-green-800 font-medium">
                      Booking confirmed! You'll be redirected shortly.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {selectedTime && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p className="font-semibold mb-2">Payment</p>
                    <div>
                      <div
                        style={{
                          overflow: "auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          width: "100%",
                          background: "#FFFFFF",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                          borderRadius: "10px",
                          fontFamily: "SQ Market, Helvetica, Arial, sans-serif",
                        }}
                      >
                        <div style={{ padding: "20px", width: "100%" }}>
                          <p
                            style={{
                              fontSize: "18px",
                              lineHeight: "20px",
                              fontWeight: 600,
                              marginBottom: "15px",
                            }}
                          >
                            $
                            {selectedService
                              ? (selectedService.price_amount / 100).toFixed(2)
                              : "0.00"}{" "}
                            {selectedService?.price_currency}
                          </p>
                          <a
                            target="_blank"
                            data-url="https://square.link/u/K0DxFxCJ?src=embd"
                            href="https://square.link/u/K0DxFxCJ?src=embed"
                            id="embedded-checkout-modal-checkout-button"
                            style={{
                              display: "inline-block",
                              fontSize: "18px",
                              lineHeight: "48px",
                              height: "48px",
                              color: "#ffffff",
                              width: "100%",
                              backgroundColor: "#006aff",
                              textAlign: "center",
                              boxShadow: "0 0 0 1px rgba(0,0,0,.1) inset",
                              borderRadius: "4px",
                              textDecoration: "none",
                            }}
                            onClick={(e) => {
                              // The Square checkout will open via our custom handler
                              // After 1 second, simulate payment completion
                              setTimeout(() => {
                                setPaymentCompleted(true);
                              }, 1000);
                            }}
                          >
                            Pay now
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-1 container mx-auto mt-0 mb-4 px-4">
        <h2 className="text-xl font-bold">Available Times</h2>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2">Loading available times...</p>
          </div>
        ) : availableTimes.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {availableTimes.map((time, index) => (
              <Button
                key={index}
                className={`rounded-md px-3 py-1 text-sm md:text-base ${
                  selectedTime?.start_at === time.start_at ? "bg-green-600" : ""
                }`}
                onClick={() => handleTimeSelection(time)}
              >
                {formatTime(time.start_at)}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-center py-4">
            No available times for the selected date. Please try another date.
          </p>
        )}
      </section>
    </main>
  );
}
