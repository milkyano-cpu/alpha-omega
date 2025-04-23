"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  AvailabilityResponse,
  BookingService,
  TimeSlot,
} from "@/lib/booking-service";
import {
  DateTimeSelector,
  BookingSummary,
  PaymentForm,
} from "@/components/pages/appointment";

// Square type definitions are added globally in types/square.d.ts

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
  // State related to availability and dates
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availabilityData, setAvailabilityData] =
    useState<AvailabilityResponse | null>(null);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache for already fetched months - key is 'YYYY-MM'
  const [monthCache, setMonthCache] = useState<
    Record<string, AvailabilityResponse>
  >({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [squareBookingId, setSquareBookingId] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Square Payment SDK states
  const [squareCard, setSquareCard] = useState<Square.Card | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Initialize Square payment form
  useEffect(() => {
    if (!showPaymentForm || !selectedService || !selectedTime) return;

    const initializeSquarePayment = async () => {
      if (!window.Square) {
        console.error("Square.js failed to load");
        setPaymentError(
          "Payment system failed to load. Please try again later."
        );
        return;
      }

      try {
        // Initialize Square payments with app ID and location ID from environment variables
        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || "";
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";

        if (!appId || !locationId) {
          console.error("Missing Square credentials in environment variables");
          setPaymentError(
            "Payment system configuration error. Please contact support."
          );
          return;
        }

        const payments = window.Square.payments(appId, locationId);

        // Create a card payment method
        const card = await payments.card();

        // Attach the card payment form to the DOM
        await card.attach("#card-container");

        // Store the card instance for later use
        setSquareCard(card);
      } catch (e: any) {
        console.error("Error initializing Square Payment:", e);
        setPaymentError("Failed to initialize payment form. Please try again.");
      }
    };

    initializeSquarePayment();

    // Cleanup function
    return () => {
      if (squareCard) {
        try {
          squareCard.destroy();
        } catch (e: any) {
          console.error("Error destroying Square payment form:", e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaymentForm, selectedService, selectedTime]);

  // Handle payment process
  const handlePayment = async () => {
    if (!squareCard || !selectedService) {
      setPaymentError("Payment form not initialized properly");
      return;
    }

    if (!user) {
      setPaymentError(
        "User information is not available. Please log in again."
      );
      return;
    }

    if (!user.square_up_id) {
      console.warn("User does not have a Square customer ID");
      // We'll continue without it, but log a warning
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // The deposit amount is the actual price in Square
      // This is 50% of the doubled price shown to customers
      const depositAmount = selectedService.price_amount;
      const formattedAmount = (depositAmount / 100).toFixed(2);

      // Create a unique idempotency key for this transaction
      // This will be used for both payment and booking to ensure consistency
      const idempotencyKey = crypto.randomUUID();

      // Prepare verification details
      const verificationDetails = {
        amount: formattedAmount,
        currencyCode: "AUD",
        intent: "CHARGE" as const, // Use type assertion to fix TypeScript error
        billingContact: {
          givenName: user.first_name || "",
          familyName: user.last_name || "",
          email: user.email || "",
          countryCode: "AU",
        },
        customerInitiated: true,
        sellerKeyedIn: false, // Adding the missing required field
      };

      // Tokenize the payment method
      const tokenResult = await squareCard.tokenize(verificationDetails);

      if (tokenResult.status === "OK") {
        // Process the payment with the token
        const paymentResponse = await fetch("/api/process-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceId: tokenResult.token,
            amount: depositAmount,
            idempotencyKey: idempotencyKey,
            locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "",
            // Pass customer details for the payment
            customerDetails: {
              squareCustomerId: user.square_up_id,
            },
          }),
        });

        if (paymentResponse.ok) {
          // Payment successful
          const paymentData = await paymentResponse.json();

          // Store payment details for booking notes and receipt
          const paymentInfo = {
            receiptUrl: paymentData.payment?.receiptUrl,
            paymentId: paymentData.payment?.id,
            amount: formattedAmount,
            currency: "AUD",
            idempotencyKey: idempotencyKey,
          };

          localStorage.setItem("paymentReceipt", JSON.stringify(paymentInfo));

          setPaymentCompleted(true);

          // Immediately create the booking in Square after successful payment
          await createBookingInSquare(idempotencyKey, paymentInfo);
        } else {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.message || "Payment processing failed");
        }
      } else {
        console.log("tokenResult.errors", tokenResult);
        throw new Error(
          `Tokenization failed: ${
            tokenResult.errors?.[0]?.detail || tokenResult.status
          }`
        );
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentError(
        error instanceof Error ? error.message : "Payment processing failed"
      );
      setProcessingPayment(false);
    }
  };

  // Create booking in Square directly after payment
  const createBookingInSquare = async (
    idempotencyKey: string,
    paymentInfo: any
  ) => {
    if (!selectedService || !selectedTime || !user) {
      console.error("Missing required booking information");
      setError("Missing required booking information for booking");
      setProcessingPayment(false);
      return;
    }

    try {
      // Get service variation version from the appointment segments
      const serviceVariationVersion =
        selectedTime.appointment_segments?.[0]?.service_variation_version;

      // Create customer note with payment details
      const customerNote =
        `50% deposit of ${paymentInfo.amount} ${paymentInfo.currency} paid via Square payment (ID: ${paymentInfo.paymentId}).\n` +
        `Receipt: ${paymentInfo.receiptUrl || "Not available"}\n` +
        `Remaining balance to be paid at appointment.`;

      // Create booking directly in Square
      const squareResponse = await BookingService.createSquareBooking({
        serviceVariationId: selectedService.service_variation_id,
        teamMemberId:
          selectedTime.appointment_segments?.[0]?.team_member_id ||
          selectedService.team_member_id,
        customerId: user.square_up_id,
        startAt: selectedTime.start_at,
        serviceVariationVersion,
        customerNote,
        idempotencyKey,
        locationId:
          selectedTime.location_id ||
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ||
          "",
      });

      // Store the Square booking ID to use in backend sync
      if (squareResponse.booking?.id) {
        setSquareBookingId(squareResponse.booking.id);

        // Update payment receipt with booking ID
        const receiptData = JSON.parse(
          localStorage.getItem("paymentReceipt") || "{}"
        );
        localStorage.setItem(
          "paymentReceipt",
          JSON.stringify({
            ...receiptData,
            squareBookingId: squareResponse.booking.id,
          })
        );

        // Attempt to sync with our backend - but don't wait for it
        syncWithBackend(
          idempotencyKey,
          squareResponse.booking.id,
          customerNote
        );

        // Mark booking as confirmed and handle UI transitions
        setBookingConfirmed(true);
        setProcessingPayment(false);

        // Save booking details for thank you page
        saveBookingDetails(squareResponse);
      }
    } catch (error: any) {
      console.error("Error creating Square booking:", error);

      // Don't show error to user - we'll still try to sync with backend
      // This ensures smoother user experience even if there are issues
      setProcessingPayment(false);

      // Try backend sync anyway - it might use a different approach
      syncWithBackend(idempotencyKey);
    }
  };

  // Sync booking with our backend system - don't block user flow on this
  const syncWithBackend = async (
    idempotencyKey: string,
    squareBookingId?: string,
    customerNote?: string
  ) => {
    if (!selectedService || !selectedTime || !user) return;

    try {
      // If we have a Square booking ID, sync it with our backend
      // But don't wait for response or block UI flow
      BookingService.syncBookingWithBackend(
        {
          service_variation_id: selectedService.service_variation_id,
          team_member_id: selectedService.team_member_id.toString(),
          start_at: selectedTime.start_at,
          service_variation_version:
            selectedTime.appointment_segments?.[0]?.service_variation_version,
          customer_note: customerNote,
          idempotencyKey,
        },
        squareBookingId
      )
        .then((response) => {
          // Handle successful backend sync
          if (response?.data?.id) {
            // Update the booking ID in localStorage
            const bookingData = JSON.parse(
              localStorage.getItem("lastBooking") || "{}"
            );
            localStorage.setItem(
              "lastBooking",
              JSON.stringify({
                ...bookingData,
                id: response.data.id,
                square_booking_id: response.data.square_booking_id,
                backend_synced: true,
              })
            );
          }
        })
        .catch((error) => {
          // Log error but don't disrupt user flow
          console.error("Error syncing with backend:", error);
        });

      // Redirect to thank you page after a short delay
      setTimeout(() => {
        // Clean up sensitive data
        localStorage.removeItem("selectedService");
        localStorage.removeItem("selectedBarberId");

        // Redirect to confirmation page
        router.push("/book/thank-you");
      }, 1500);
    } catch (error) {
      console.error("Error in backend sync:", error);
      // Still redirect user to thank you page - Square booking is confirmed
      setTimeout(() => router.push("/book/thank-you"), 1500);
    }
  };

  // Save booking details for thank you page
  const saveBookingDetails = (squareResponse: any) => {
    if (!selectedService || !selectedTime) return;

    try {
      localStorage.setItem(
        "lastBooking",
        JSON.stringify({
          id: squareResponse.booking?.id || "pending",
          square_booking_id: squareResponse.booking?.id,
          service: selectedService.name,
          date: new Date(selectedTime.start_at).toLocaleDateString(),
          time: new Date(selectedTime.start_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          deposit: (selectedService.price_amount / 200).toFixed(2), // 50% of the price
          total: (selectedService.price_amount / 100).toFixed(2),
          status: squareResponse.booking?.status || "confirmed",
          square_confirmed: true,
          backend_synced: false,
        })
      );
    } catch (error) {
      console.error("Error saving booking details:", error);
    }
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
    } catch (err: any) {
      console.error("Error parsing selected service:", err);
      router.push("/book/services");
    }
  }, [isAuthenticated, router]);

  // Fetch available times when date changes
  // Fetch availability data when month changes or service changes
  useEffect(() => {
    if (!selectedService) return;

    // Extract month and year for dependency tracking and caching
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const cacheKey = `${currentYear}-${currentMonth}`;

    const fetchAvailabilityData = async () => {
      // Check if we already have this month in cache
      if (monthCache[cacheKey]) {
        console.log(`Using cached data for ${cacheKey}`);
        // Use cached data
        const cachedData = monthCache[cacheKey];
        setAvailabilityData(cachedData);

        // Extract available dates from cached data
        const dates = Object.keys(cachedData.availabilities_by_date);
        setAvailableDates(dates);

        // Update time slots for selected date
        const dateKey = selectedDate.toISOString().split("T")[0];
        const availabilities = cachedData.availabilities_by_date[dateKey] || [];

        // Sort times chronologically
        availabilities.sort(
          (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        );

        setAvailableTimes(availabilities);
        return;
      }

      // If not in cache, fetch new data
      setIsLoading(true);
      setError(null);

      try {
        // Calculate date range
        // If we're in the current month, start from today
        // Otherwise, start from the 1st of the month
        const now = new Date();
        const isCurrentMonth =
          now.getMonth() === currentMonth && now.getFullYear() === currentYear;

        // Start date - either today or 1st of month
        const startDate = isCurrentMonth
          ? new Date(now.setHours(0, 0, 0, 0))
          : new Date(currentYear, currentMonth, 1);

        // End date - last day of the month
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        console.log(
          `Fetching availability for ${cacheKey} from`,
          startDate.toISOString(),
          "to",
          endDate.toISOString()
        );

        // Make a single request for the entire date range
        const response = await BookingService.searchAvailability(
          selectedService.service_variation_id,
          startDate,
          endDate
        );

        // Store the response in cache
        setMonthCache((prev) => ({
          ...prev,
          [cacheKey]: response,
        }));

        // Update state with response data
        setAvailabilityData(response);

        // Extract available dates
        const dates = Object.keys(response.availabilities_by_date);
        console.log(`${cacheKey} available dates:`, dates);
        setAvailableDates(dates);

        // If the selected date has available times, set them
        const dateKey = selectedDate.toISOString().split("T")[0];
        const availabilities = response.availabilities_by_date[dateKey] || [];

        // Sort times chronologically
        availabilities.sort(
          (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        );

        setAvailableTimes(availabilities);
      } catch (err: any) {
        console.error("Error fetching availability:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load availability"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityData();
    // We need to disable ESLint for this complex dependency because we're checking specific parts of selectedDate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedDate.getMonth(),
    selectedDate.getFullYear(),
    selectedService,
    monthCache,
  ]);

  // Update available times when selected date changes
  useEffect(() => {
    if (!availabilityData) return;

    // Get the key for the selected date
    const dateKey = selectedDate.toISOString().split("T")[0];

    // Get available times for this date from the existing data
    const availabilities =
      availabilityData.availabilities_by_date[dateKey] || [];

    // Sort times chronologically
    availabilities.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );

    console.log(
      `Found ${availabilities.length} available slots for ${dateKey}`
    );
    setAvailableTimes(availabilities);
    setSelectedTime(null); // Reset selected time when date changes
  }, [availabilityData, selectedDate]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset selected time when date changes
  };

  // Handle month changes from the calendar
  const handleMonthChange = (date: Date) => {
    console.log("Month changed to:", date);
    // Clear any previously selected time
    setSelectedTime(null);

    // Create cache key for the target month
    const targetMonth = date.getMonth();
    const targetYear = date.getFullYear();
    const cacheKey = `${targetYear}-${targetMonth}`;

    // Check if month data is already in cache
    const isCached = !!monthCache[cacheKey];

    // Only show loading state if we need to fetch
    if (!isCached) {
      // Reset available times until we get new data
      setAvailableTimes([]);
      console.log(`No cached data for ${cacheKey}, will fetch`);
    } else {
      console.log(`Found cached data for ${cacheKey}, no need to fetch`);
    }

    // Update selectedDate to the first day of the new month
    const newMonthDate = new Date(date.getFullYear(), date.getMonth(), 1);
    setSelectedDate(newMonthDate);
  };

  const handleTimeSelection = (time: TimeSlot) => {
    setSelectedTime(time);
  };

  // Show payment form
  const handleShowPaymentForm = () => {
    if (!selectedService || !selectedTime || !user) {
      setError("Please select a service and time first");
      return;
    }
    setShowPaymentForm(true);
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

  // Rendering different states based on booking flow
  const renderBookingStatus = () => {
    if (bookingConfirmed) {
      return (
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg mb-3 text-sm">
          <p className="text-green-800 font-medium">
            <svg
              className="inline-block w-5 h-5 mr-1 -mt-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Booking confirmed successfully! You&apos;ll be redirected to your
            confirmation details.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="flex flex-col gap-6 mt-30 mb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Calendar and time selection */}
          <DateTimeSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onMonthChange={handleMonthChange}
            onTimeSelect={handleTimeSelection}
            selectedTime={selectedTime}
            availableTimes={availableTimes}
            availableDates={availableDates}
            isLoading={isLoading}
          />

          {/* Right column - Booking summary and payment */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-base font-semibold mb-3">SUMMARY</h2>
            {renderBookingStatus()}

            {showPaymentForm ? (
              <PaymentForm
                squareCard={squareCard}
                selectedService={selectedService}
                selectedTime={selectedTime}
                processingPayment={processingPayment}
                paymentError={paymentError}
                handlePayment={handlePayment}
                onCancelPayment={() => setShowPaymentForm(false)}
              />
            ) : (
              <BookingSummary
                selectedService={selectedService}
                selectedTime={selectedTime}
                error={error}
                onProceedToPayment={handleShowPaymentForm}
                showPaymentForm={showPaymentForm}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
