"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AvailabilityResponse, BookingService, TimeSlot } from "@/lib/booking-service";

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
  const [availabilityData, setAvailabilityData] = useState<AvailabilityResponse | null>(null);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache for already fetched months - key is 'YYYY-MM'
  const [monthCache, setMonthCache] = useState<Record<string, AvailabilityResponse>>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [, setBookingId] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Square Payment SDK states
  const [paymentForm, setPaymentForm] = useState<HTMLDivElement | null>(null);
  const [squareCard, setSquareCard] = useState<Square.Card | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Initialize Square payment form
  useEffect(() => {
    if (!showPaymentForm || !selectedService || !selectedTime) return;
    
    const initializeSquarePayment = async () => {
      if (!window.Square) {
        console.error('Square.js failed to load');
        setPaymentError('Payment system failed to load. Please try again later.');
        return;
      }

      try {
        // Initialize Square payments with app ID and location ID from environment variables
        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || 'sandbox-sq0idb-P_U19QHlNsZi7N9qLb0rAg';
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'L87WGNMM3QSAP';
        const payments = window.Square.payments(appId, locationId);
        
        // Create a card payment method
        const card = await payments.card();
        
        // Attach the card payment form to the DOM
        await card.attach('#card-container');
        
        // Store the card instance for later use
        setSquareCard(card);
      } catch (e) {
        console.error('Error initializing Square Payment:', e);
        setPaymentError('Failed to initialize payment form. Please try again.');
      }
    };

    initializeSquarePayment();
    
    // Cleanup function
    return () => {
      if (squareCard) {
        try {
          squareCard.destroy();
        } catch (e) {
          console.error('Error destroying Square payment form:', e);
        }
      }
    };
  }, [showPaymentForm, selectedService, selectedTime]);

  // Handle payment process
  const handlePayment = async () => {
    if (!squareCard || !selectedService) {
      setPaymentError('Payment form not initialized properly');
      return;
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // Calculate 50% of the price
      const depositAmount = selectedService.price_amount / 2;
      const formattedAmount = (depositAmount / 100).toFixed(2);

      // Prepare verification details
      const verificationDetails: Square.VerificationDetails = {
        amount: formattedAmount,
        currencyCode: 'AUD',
        intent: 'CHARGE' as 'CHARGE', // Type assertion to ensure it matches the expected type
        billingContact: {
          givenName: user?.first_name || '',
          familyName: user?.last_name || '',
          email: user?.email || '',
          countryCode: 'AU',
        },
        customerInitiated: true,
      };

      // Tokenize the payment method
      const tokenResult = await squareCard.tokenize(verificationDetails);
      
      if (tokenResult.status === 'OK') {
        // Process the payment with the token
        const paymentResponse = await fetch('/api/process-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: tokenResult.token,
            amount: depositAmount,
            idempotencyKey: self.crypto.randomUUID(),
            locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'L87WGNMM3QSAP',
          }),
        });

        if (paymentResponse.ok) {
          // Payment successful
          setPaymentCompleted(true);
          setProcessingPayment(false);
        } else {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.message || 'Payment processing failed');
        }
      } else {
        throw new Error(`Tokenization failed: ${tokenResult.errors?.[0]?.message || tokenResult.status}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment processing failed');
      setProcessingPayment(false);
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
    } catch (err) {
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
          (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
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
          now.getMonth() === currentMonth && 
          now.getFullYear() === currentYear;
        
        // Start date - either today or 1st of month
        const startDate = isCurrentMonth 
          ? new Date(now.setHours(0, 0, 0, 0)) 
          : new Date(currentYear, currentMonth, 1);
        
        // End date - last day of the month
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        console.log(`Fetching availability for ${cacheKey} from`, startDate.toISOString(), 'to', endDate.toISOString());
        
        // Make a single request for the entire date range
        const response = await BookingService.searchAvailability(
          selectedService.service_variation_id,
          startDate,
          endDate
        );

        // Store the response in cache
        setMonthCache(prev => ({
          ...prev,
          [cacheKey]: response
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
          (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        );
        
        setAvailableTimes(availabilities);
      } catch (err) {
        console.error("Error fetching availability:", err);
        setError(err instanceof Error ? err.message : "Failed to load availability");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityData();
    
  }, [selectedDate.getMonth(), selectedDate.getFullYear(), selectedService, monthCache]);

  // Update available times when selected date changes
  useEffect(() => {
    if (!availabilityData) return;
    
    // Get the key for the selected date
    const dateKey = selectedDate.toISOString().split("T")[0];
    
    // Get available times for this date from the existing data
    const availabilities = availabilityData.availabilities_by_date[dateKey] || [];
    
    // Sort times chronologically
    availabilities.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
    
    console.log(`Found ${availabilities.length} available slots for ${dateKey}`);
    setAvailableTimes(availabilities);
    setSelectedTime(null); // Reset selected time when date changes
  }, [selectedDate, availabilityData]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset selected time when date changes
  };

  // Handle month changes from the calendar
  const handleMonthChange = (date: Date) => {
    console.log('Month changed to:', date);
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

      // Add customer note indicating 50% deposit was paid
      const customerNote = "50% deposit paid via Square payment. Remaining balance to be paid at appointment.";

      // Use BookingService to create booking
      const bookingData = await BookingService.createBooking({
        service_variation_id: selectedService.service_variation_id,
        team_member_id: selectedService.team_member_id.toString(),
        start_at: selectedTime.start_at,
        service_variation_version: serviceVariationVersion,
        customer_note: customerNote
      });

      console.log("Booking created:", bookingData);

      // Set booking as confirmed and store the ID
      setBookingConfirmed(true);
      if (bookingData?.data?.id) {
        setBookingId(bookingData.data.id.toString());

        // Save booking details to localStorage for reference on thank you page
        localStorage.setItem("lastBooking", JSON.stringify({
          id: bookingData.data.id,
          service: selectedService.name,
          date: new Date(selectedTime.start_at).toLocaleDateString(),
          time: new Date(selectedTime.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          deposit: ((selectedService.price_amount / 2) / 100).toFixed(2),
          total: (selectedService.price_amount / 100).toFixed(2),
          status: bookingData.data.status || "confirmed"
        }));
      }

      // After a brief delay, redirect to thank you page
      setTimeout(() => {
        // Clear selection data from localStorage
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
      if (showPaymentForm) {
        return (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <p className="p-3 font-medium text-base border-b border-gray-100 bg-gray-50">
              Payment - 50% Deposit
            </p>
            <div className="p-5">
              <p className="text-md mb-2">
                Please provide your card details to pay a 50% deposit:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Secure Payment</strong>: Your card information is processed securely by Square.
                  The remaining balance will be collected at the barbershop.
                </p>
              </div>
              <p className="text-xl font-medium mb-4">
                $
                {selectedService
                  ? ((selectedService.price_amount / 2) / 100).toFixed(2)
                  : "0.00"}{" "}
                AUD
              </p>
              
              {paymentError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {paymentError}
                </div>
              )}
              
              <div id="card-container" className="mb-5 border rounded-md p-3 min-h-[140px]"></div>
              
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Deposit Amount:</span>
                  <span className="font-medium">
                    ${selectedService ? ((selectedService.price_amount / 2) / 100).toFixed(2) : "0.00"} AUD
                  </span>
                </div>
                <div className="bg-gray-50 border-t border-gray-200 pt-2 mt-1 flex items-center justify-between">
                  <span className="font-medium">Total Payment:</span>
                  <span className="font-bold">
                    ${selectedService ? ((selectedService.price_amount / 2) / 100).toFixed(2) : "0.00"} AUD
                  </span>
                </div>
              </div>
              
              <Button
                className="w-full py-3 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-md font-normal mt-4"
                onClick={handlePayment}
                disabled={processingPayment}
              >
                {processingPayment ? "Processing..." : "Pay Deposit Now"}
              </Button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                By proceeding with payment, you agree to our <a href="#" className="underline">Terms of Service</a>
              </p>
              
              <button 
                type="button" 
                className="w-full mt-2 text-sm text-gray-500 hover:underline"
                onClick={() => setShowPaymentForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <p className="p-3 font-medium text-base border-b border-gray-100 bg-gray-50">
              Payment
            </p>
            <div className="p-5">
              <p className="text-xl font-medium mb-1">
                $
                {selectedService
                  ? (selectedService.price_amount / 100).toFixed(2)
                  : "0.00"}{" "}
                AUD
              </p>
              <p className="text-sm text-gray-600 mb-4">50% deposit required: ${selectedService ? ((selectedService.price_amount / 2) / 100).toFixed(2) : "0.00"} AUD</p>
              <Button
                className="w-full py-3 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-md font-normal"
                onClick={handleShowPaymentForm}
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  // Render available times section
  const renderAvailableTimes = () => {
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
  
  // Skeleton loader for calendar
  const renderCalendarSkeleton = () => (
    <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-sm">
      {/* Month and navigation header */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex gap-1">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Days of week */}
      <div className="grid grid-cols-7 text-center gap-1 mb-2">
        {Array(7).fill(0).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
      
      {/* Calendar grid - 5 weeks */}
      {Array(5).fill(0).map((_, week) => (
        <div key={week} className="grid grid-cols-7 gap-1 mb-1">
          {Array(7).fill(0).map((_, day) => (
            <div 
              key={`${week}-${day}`} 
              className="h-10 bg-gray-200 rounded-md animate-pulse"
              style={{ animationDelay: `${(week * 7 + day) * 50}ms` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
  
  // Skeleton loader for time slots
  const renderTimeSlotsSkeleton = () => (
    <div className="flex flex-wrap gap-4">
      {Array(8).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="min-w-[100px] h-10 bg-gray-200 rounded-md animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        ></div>
      ))}
    </div>
  );

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
            {isLoading ? (
              renderCalendarSkeleton()
            ) : (
              <BookingCalendar
                selectedDate={selectedDate}
                onChange={handleDateChange}
                onMonthChange={handleMonthChange}
                availableDates={availableDates}
              />
            )}

            {/* Available times section */}
            <div className="mt-5">
              <h3 className="text-base font-semibold mb-3">Available Times</h3>
              {isLoading ? renderTimeSlotsSkeleton() : renderAvailableTimes()}
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
