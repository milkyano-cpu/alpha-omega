"use client";

import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Service, TimeSlot, BookingService } from "@/lib/booking-service";
import { useAuth } from "@/lib/auth-context";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Image from "next/image";

dayjs.extend(utc);
dayjs.extend(timezone);

interface StablePaymentFormProps {
  selectedService: Service | null;
  selectedTime: TimeSlot | null;
  selectedServices: Service[];
  onPaymentComplete: () => void;
  onCancel: () => void;
  onAddAdditionalService?: () => void; // Optional callback to add additional services
  isLoadingServices?: boolean; // Loading state for additional services
  onPaymentStateChange?: (
    processingPayment: boolean,
    creatingBooking: boolean,
  ) => void; // Callback to notify parent of payment states
}

export const StablePaymentForm: React.FC<StablePaymentFormProps> = ({
  selectedService,
  selectedTime,
  selectedServices,
  onPaymentComplete,
  onCancel,
  onAddAdditionalService,
  isLoadingServices = false,
  onPaymentStateChange,
}) => {
  const { user } = useAuth();
  const [squareInitialized, setSquareInitialized] = useState(false);
  const [squareCard, setSquareCard] = useState<Square.Card | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [usedIdempotencyKeys, setUsedIdempotencyKeys] = useState<Set<string>>(
    new Set(),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const initializationAttempted = useRef(false);
  const mountedRef = useRef(true);
  const [isMounted, setIsMounted] = useState(false);

  // Generate stable container ID once
  const containerId = useRef(
    `stable-square-card-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`,
  );

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
    return () => {
      setIsMounted(false);
      mountedRef.current = false;
    };
  }, []);

  // Reset initialization when selectedTime changes
  useEffect(() => {
    if (selectedTime) {
      console.log("🔄 Selected time changed, resetting Square initialization");
      
      // Clean up existing card if any (capture current squareCard in closure)
      const currentCard = squareCard;
      if (currentCard) {
        try {
          currentCard.destroy();
          console.log("✅ Previous Square card destroyed");
        } catch (e) {
          console.log("Note: Error during card cleanup:", e);
        }
      }
      
      // Reset initialization flags immediately
      initializationAttempted.current = false;
      setSquareInitialized(false);
      setSquareCard(null);
      setPaymentError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime]); // Only depend on selectedTime, squareCard is captured in closure

  // Initialize Square payment form when mounted and time is selected
  useEffect(() => {
    console.log("🔄 StablePaymentForm useEffect triggered", {
      initializationAttempted: initializationAttempted.current,
      mounted: mountedRef.current,
      isMounted,
      squareInitialized,
      hasSelectedTime: !!selectedTime,
    });

    if (!isMounted || !selectedTime || initializationAttempted.current || squareInitialized) {
      console.log("⏭️ Skipping initialization:", {
        isMounted,
        hasSelectedTime: !!selectedTime,
        alreadyAttempted: initializationAttempted.current,
        alreadyInitialized: squareInitialized,
      });
      return;
    }

    initializationAttempted.current = true;
    console.log("🚀 Starting Square initialization process");

    const initializeSquare = async () => {
      try {
        console.log("🔄 Starting Square initialization...");
        console.log("📋 Environment debug:", {
          NEXT_PUBLIC_SQUARE_ENVIRONMENT:
            process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT,
          NEXT_PUBLIC_SQUARE_APP_ID:
            process.env.NEXT_PUBLIC_SQUARE_APP_ID?.substring(0, 20) + "...",
          NEXT_PUBLIC_SQUARE_LOCATION_ID:
            process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
          windowSquare:
            typeof window !== "undefined" ? !!window.Square : "not in browser",
          documentReadyState:
            typeof document !== "undefined"
              ? document.readyState
              : "not in browser",
        });

        // Wait for Square SDK with extended timeout for sandbox
        let retries = 0;
        const maxRetries = 20; // Increased from 10 to 20
        const retryDelay = 750; // Increased from 500ms to 750ms

        while (!window.Square && retries < maxRetries) {
          console.log(
            `⏳ Waiting for Square SDK... attempt ${retries + 1}/${maxRetries}`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retries++;
        }

        if (!window.Square) {
          const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;
          const expectedUrl =
            environment === "production"
              ? "https://web.squarecdn.com/v1/square.js"
              : "https://sandbox.web.squarecdn.com/v1/square.js";

          console.error("❌ Square SDK not available after retries:", {
            retries: maxRetries,
            totalWaitTime: `${(maxRetries * retryDelay) / 1000}s`,
            environment,
            expectedUrl,
            userAgent:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : "unknown",
          });
          throw new Error(
            `Square SDK failed to load after ${
              (maxRetries * retryDelay) / 1000
            } seconds. Check network connection and environment configuration.`,
          );
        }

        console.log("✅ Square SDK detected, proceeding with initialization");

        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || "";
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";

        if (!appId || !locationId) {
          console.error("❌ Missing Square credentials:", {
            appId: !!appId,
            locationId: !!locationId,
          });
          throw new Error("Missing Square credentials");
        }

        console.log("🔄 Initializing stable Square payment form");
        console.log("📋 Square credentials:", { appId, locationId });

        const payments = window.Square.payments(appId, locationId);
        console.log("✅ Square payments instance created");

        // Retry card creation with timeout handling
        let card: Square.Card | undefined;
        let cardRetries = 0;
        const maxCardRetries = 3;

        while (cardRetries < maxCardRetries) {
          try {
            console.log(
              `🔄 Creating Square card instance... attempt ${
                cardRetries + 1
              }/${maxCardRetries}`,
            );

            // Create card with timeout
            const cardPromise = payments.card();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(
                () =>
                  reject(new Error("Card creation timeout after 10 seconds")),
                10000,
              ),
            );

            card = await Promise.race([cardPromise, timeoutPromise]);
            console.log("✅ Square card instance created");
            break;
          } catch (error: any) {
            cardRetries++;
            console.error(
              `❌ Card creation attempt ${cardRetries} failed:`,
              error.message,
            );

            if (cardRetries >= maxCardRetries) {
              throw new Error(
                `Failed to create Square card after ${maxCardRetries} attempts: ${error.message}`,
              );
            }

            // Wait before retry
            console.log(`⏳ Retrying card creation in 2 seconds...`);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (!card) {
          throw new Error("Failed to create Square card");
        }

        // Wait for DOM element with more robust checking
        let domRetries = 0;
        const maxDomRetries = 30; // Increased retries
        
        while (domRetries < maxDomRetries) {
          // Check both containerRef and actual DOM element
          const domElement = document.getElementById(containerId.current);
          
          if (containerRef.current && domElement) {
            console.log("✅ DOM container found and ready for Square attachment");
            break;
          }
          
          console.log(
            `⏳ Waiting for DOM container... attempt ${domRetries + 1}/${maxDomRetries}`,
            {
              containerRef: !!containerRef.current,
              domElement: !!domElement,
              containerId: containerId.current,
            }
          );
          
          await new Promise((resolve) => setTimeout(resolve, 150)); // Increased delay
          domRetries++;
        }

        const finalDomElement = document.getElementById(containerId.current);
        if (!containerRef.current || !finalDomElement) {
          console.error("❌ Container not found after retries", {
            containerRef: !!containerRef.current,
            domElement: !!finalDomElement,
            containerId: containerId.current,
            retries: domRetries,
          });
          throw new Error("Container not found");
        }

        console.log(
          `🔗 Attaching Square card to container: #${containerId.current}`,
        );

        // Retry card attach with timeout
        let attachRetries = 0;
        const maxAttachRetries = 2;

        while (attachRetries < maxAttachRetries) {
          try {
            const attachPromise = card.attach(`#${containerId.current}`);
            const attachTimeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("Card attach timeout after 8 seconds")),
                8000,
              ),
            );

            await Promise.race([attachPromise, attachTimeoutPromise]);
            console.log("✅ Square card attached to DOM");
            break;
          } catch (error: any) {
            attachRetries++;
            console.error(
              `❌ Card attach attempt ${attachRetries} failed:`,
              error.message,
            );

            if (attachRetries >= maxAttachRetries) {
              throw new Error(
                `Failed to attach Square card after ${maxAttachRetries} attempts: ${error.message}`,
              );
            }

            console.log(`⏳ Retrying card attach in 1 second...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        setSquareCard(card);
        setSquareInitialized(true);
        setPaymentError(null);

        console.log("✅ Stable Square payment form initialized");
      } catch (error: any) {
        console.error("❌ Stable Square initialization failed:", error);
        setPaymentError(error.message);
      }
    };

    // Initialize after a brief delay for production compatibility
    const timer = setTimeout(initializeSquare, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [isMounted, squareInitialized, selectedTime]); // Depend on mounted state, initialization status, and selected time

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (squareCard) {
        try {
          console.log("🧹 Cleaning up stable Square card");
          squareCard.destroy();
        } catch (e) {
          console.error("Error destroying stable Square card:", e);
        }
      }
    };
  }, [squareCard]);

  // Notify parent when payment states change
  useEffect(() => {
    if (onPaymentStateChange) {
      onPaymentStateChange(processingPayment, creatingBooking);
    }
  }, [processingPayment, creatingBooking, onPaymentStateChange]);

  const createBookingWithoutPayment = async (idempotencyKey: string) => {
    console.log("📅 Creating booking without payment first...");

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Booking creation timeout after 30 seconds")),
        30000,
      ),
    );

    if (!selectedTime?.appointment_segments?.[0]?.team_member_id) {
      throw new Error("No barber selected for the appointment");
    }

    // Prepare booking request for single booking with multiple segments
    const appointmentSegments = selectedServices.map((service, index) => {
      const segmentStartTime =
        index === 0
          ? selectedTime.start_at
          : dayjs(selectedTime.start_at)
              .add(
                selectedServices
                  .slice(0, index)
                  .reduce((total, s) => total + s.duration, 0),
                "minute",
              )
              .toISOString();

      return {
        service_variation_id: service.service_variation_id,
        team_member_id: selectedTime.appointment_segments[0].team_member_id,
        duration_minutes:
          service.duration > 10000
            ? service.duration / 60000
            : service.duration,
        start_at: segmentStartTime,
        service_variation_version: 1,
      };
    });

    const bookingRequest = {
      start_at: selectedTime.start_at,
      appointment_segments: appointmentSegments,
      customerNote: `Multi-service booking - payment to be processed separately`,
      idempotencyKey: idempotencyKey,
      // No payment_info - create booking first
    };

    console.log(
      "📋 Booking request (no payment):",
      JSON.stringify(bookingRequest, null, 2),
    );

    // Create the booking using segments API with timeout
    console.log("🔄 Calling BookingService.createBookingWithSegments...");
    const bookingPromise =
      BookingService.createBookingWithSegments(bookingRequest);
    const response = (await Promise.race([
      bookingPromise,
      timeoutPromise,
    ])) as any;
    console.log("📨 Booking API response:", JSON.stringify(response, null, 2));

    // Check the correct success field in the response
    if (response.data?.success) {
      console.log("✅ Booking created successfully (without payment)");
      return response.data; // Return the data object which contains success and booking
    } else {
      console.error("❌ Booking creation failed - API returned success: false");
      console.error("Response error:", response.data?.error || response.error);
      throw new Error(
        response.data?.error || response.error || "Failed to create booking",
      );
    }
  };

  const attachPaymentToBooking = async (
    bookingResponse: any,
    paymentInfo: any,
  ) => {
    console.log("💳 Attaching payment to existing booking...");

    try {
      // Store successful booking information with payment
      const bookingInfo = {
        bookingId: bookingResponse.data?.booking?.id,
        squareBookingId: bookingResponse.data?.booking?.square_booking_id,
        paymentInfo: paymentInfo,
        services: selectedServices,
        teamMemberId: selectedTime?.appointment_segments?.[0]?.team_member_id,
        startAt: selectedTime?.start_at,
      };

      localStorage.setItem("completedBooking", JSON.stringify(bookingInfo));
      localStorage.setItem("paymentReceipt", JSON.stringify(paymentInfo));

      console.log("✅ Payment attached to booking successfully");
      return bookingInfo;
    } catch (error: any) {
      console.error("❌ Failed to attach payment to booking:", error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (
      !squareCard ||
      processingPayment ||
      creatingBooking ||
      !selectedService ||
      !selectedTime ||
      !user
    ) {
      return;
    }

    setProcessingPayment(true);
    setCreatingBooking(true);
    setPaymentError(null);

    try {
      console.log("🔄 Starting NEW booking-first flow");

      // Generate unique idempotency key
      let idempotencyKey: string;
      let attempts = 0;
      do {
        idempotencyKey = crypto.randomUUID();
        attempts++;
        if (attempts > 10) {
          throw new Error("Unable to generate unique idempotency key");
        }
      } while (usedIdempotencyKeys.has(idempotencyKey));

      // Add to used keys immediately to prevent reuse
      setUsedIdempotencyKeys((prev) => new Set([...prev, idempotencyKey]));
      console.log("Generated idempotency key:", idempotencyKey);

      // STEP 1: Create booking without payment
      console.log("📅 Step 1: Creating booking without payment...");
      const bookingResponse = await createBookingWithoutPayment(
        idempotencyKey + "-booking",
      );
      console.log("✅ Booking created successfully, now processing payment...");

      // STEP 2: Process payment
      console.log("💳 Step 2: Processing payment...");

      // Extract updated customer ID from booking response if available
      const updatedCustomerId =
        bookingResponse.updatedCustomerId ||
        bookingResponse.booking?.user?.square_up_id ||
        user.square_up_id;
      console.log("💳 Using customer ID for payment:", {
        originalUserId: user.square_up_id,
        updatedFromBookingResponse: bookingResponse.updatedCustomerId,
        updatedFromBookingUser: bookingResponse.booking?.user?.square_up_id,
        finalCustomerId: updatedCustomerId,
      });

      // Calculate amounts
      const subtotalAmount = selectedServices.reduce(
        (total, service) => total + service.price_amount,
        0,
      );

      const cardFee = Math.round(subtotalAmount * 0.022); // 2.2% fee on full subtotal
      const baseDepositAmount = Math.round(subtotalAmount * 0.5); // 50% deposit
      const depositAmount = baseDepositAmount + cardFee; // Deposit includes entire card fee
      const formattedAmount = (depositAmount / 100).toFixed(2);

      // Prepare verification details for tokenization
      const verificationDetails = {
        amount: formattedAmount,
        currencyCode: "AUD",
        intent: "CHARGE" as const,
        billingContact: {
          givenName: user.first_name || "",
          familyName: user.last_name || "",
          email: user.email || "",
          countryCode: "AU",
        },
        customerInitiated: true,
        sellerKeyedIn: false,
      };

      // Tokenize the card
      const tokenResult = await squareCard.tokenize(verificationDetails);

      if (tokenResult.status === "OK" && tokenResult.token) {
        console.log("✅ Card tokenization successful");

        // Process payment with the updated customer ID from booking response
        const paymentResponse = await fetch("/api/process-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceId: tokenResult.token,
            amount: depositAmount,
            idempotencyKey: idempotencyKey + "-payment",
            locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "",
            customerDetails: {
              squareCustomerId: updatedCustomerId,
            },
            userToken: localStorage.getItem('token')
          }),
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log("✅ Payment processed successfully");

          // Store payment details
          const paymentInfo = {
            receiptUrl: paymentData.payment?.receiptUrl,
            paymentId: paymentData.payment?.id,
            amount: formattedAmount,
            currency: "AUD",
            idempotencyKey: idempotencyKey,
          };

          // STEP 3: Attach payment to booking
          console.log("🔗 Step 3: Attaching payment to booking...");
          await attachPaymentToBooking(bookingResponse, paymentInfo);

          // Store payment success for debugging
          localStorage.setItem("paymentSuccessful", JSON.stringify({
            paymentId: paymentData.payment?.id,
            amount: formattedAmount,
            timestamp: new Date().toISOString(),
            idempotencyKey,
            bookingId: bookingResponse.data?.booking?.id
          }));
          
          console.log('✅ Complete NEW booking-first flow finished successfully');

          // Call completion callback immediately after payment success
          console.log('🎯 Calling onPaymentComplete callback after payment success...');
          onPaymentComplete();
          console.log("✅ onPaymentComplete callback executed");
        } else {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.message || "Payment processing failed");
        }
      } else {
        throw new Error(
          tokenResult.errors?.[0]?.detail || "Card tokenization failed",
        );
      }
    } catch (error: any) {
      console.error("❌ NEW booking-first flow failed:", error);
      setPaymentError(error.message || "Booking and payment flow failed");
    } finally {
      setProcessingPayment(false);
      setCreatingBooking(false);
    }
  };

  // Calculate pricing (matching BookingSummary logic)
  const subtotalAmount = selectedServices.reduce((total, service) => {
    return total + service.price_amount / 100;
  }, 0);
  const cardFee = subtotalAmount * 0.022; // 2.2% card fee on full subtotal
  const baseDepositAmount = subtotalAmount * 0.5; // 50% deposit of services
  const depositAmount = baseDepositAmount + cardFee; // Deposit + entire card fee
  const totalAmount = subtotalAmount + cardFee; // Total including card fee
  const balanceAmount = subtotalAmount - baseDepositAmount; // Balance due (exactly 50% of subtotal)

  // Debug logging for render state
  console.log("🎨 StablePaymentForm render state:", {
    squareInitialized,
    paymentError,
    processingPayment,
    creatingBooking,
    containerIdValue: containerId.current,
  });

  return (
    <div className="space-y-4">
      {/* Services Summary */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Selected Services */}
        {selectedServices.map((service, index) => (
          <div
            key={service.id}
            className={`p-3 border-b border-gray-200 flex justify-between items-center ${
              index === 0 ? "bg-gray-50" : "bg-blue-50"
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{service.name}</p>
              {index === 0 && selectedServices.length > 1 && (
                <p className="text-xs text-gray-600">Primary service</p>
              )}
              {index > 0 && (
                <p className="text-xs text-gray-600">Additional service</p>
              )}
            </div>
            <div className="flex gap-3 text-xs text-gray-600">
              <span>${(service.price_amount / 100).toFixed(2)}</span>
              <span>
                {service.duration > 10000
                  ? Math.round(service.duration / 60000)
                  : service.duration}{" "}
                min
              </span>
            </div>
          </div>
        ))}

        {/* Pricing Breakdown */}
        <div className="p-3 flex justify-between items-center">
          <p className="text-sm">Subtotal</p>
          <p className="font-medium">${subtotalAmount.toFixed(2)}</p>
        </div>
        <div className="p-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm">Card Payment Fee (2.2%)</p>
          <p className="font-medium">${cardFee.toFixed(2)}</p>
        </div>
        <div className="p-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm font-semibold">Total</p>
          <p className="font-semibold">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="p-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm">Deposit (50%)</p>
          <p className="font-medium">${depositAmount.toFixed(2)}</p>
        </div>
        <div className="p-3 border-t border-gray-100 flex justify-between items-center text-gray-500 text-sm">
          <p>Balance due at appointment</p>
          <p>${balanceAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Selected Time */}
      {selectedTime && (
        <div className="p-3 border border-green-500 rounded-lg bg-green-50">
          <p className="font-medium text-sm mb-1">Selected Time:</p>
          <p className="text-lg font-medium">
            {dayjs(selectedTime.start_at)
              .tz("Australia/Melbourne")
              .format("h:mm A")}
          </p>
          <p className="text-base font-bold">
            {dayjs(selectedTime.start_at)
              .tz("Australia/Melbourne")
              .format("dddd, MMM D")}
          </p>
        </div>
      )}

      {/* Payment Form - Only show when time is selected */}
      {selectedTime && (
        <div className="space-y-4">
          {!squareInitialized && !paymentError && (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Loading payment form...</p>
            </div>
          )}

          {paymentError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Payment Error:</p>
              <p className="text-sm text-red-600">{paymentError}</p>
              {paymentError.includes("Payment successful") && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Your payment was processed but booking creation failed.
                    Please contact support with payment ID from your bank
                    statement.
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  setPaymentError(null);
                  initializationAttempted.current = false;
                  // Trigger re-initialization
                  window.location.reload();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Square Card Container */}
          <div
            ref={containerRef}
            id={containerId.current}
            style={{
              minHeight: "56px",
              display: squareInitialized ? "block" : "none",
            }}
          />

          <Image
            src={"/assets/secure-payment.png"}
            alt="secure payment"
            height={120}
            width={120}
          />

          {/* Debug info */}
          {process.env.NODE_ENV === "development" && (
            <div className="p-2 bg-gray-100 text-xs rounded text-gray-600">
              Debug: Container ID = {containerId.current}
              <br />
              Initialized: {squareInitialized ? "Yes" : "No"}
              <br />
              Error: {paymentError || "None"}
            </div>
          )}

          {/* Add Additional Service Button */}
          {onAddAdditionalService &&
            squareInitialized &&
            !processingPayment &&
            !creatingBooking && (
              <Button
                onClick={onAddAdditionalService}
                variant="outline"
                className="w-full py-2 text-sm border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500"
                disabled={isLoadingServices}
              >
                {isLoadingServices ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Loading Services...
                  </div>
                ) : (
                  "+ Add Another Service"
                )}
              </Button>
            )}

          {/* Payment Button */}
          {squareInitialized && (
            <Button
              onClick={handlePayment}
              disabled={processingPayment || creatingBooking}
              className="w-full py-3 text-base bg-black hover:bg-gray-800 transition-colors text-white rounded-md font-normal"
            >
              {processingPayment
                ? "Processing Payment..."
                : creatingBooking
                ? "Creating Booking..."
                : `Pay Deposit $${depositAmount.toFixed(2)}`}
            </Button>
          )}

          {/* Cancel Button */}
          <Button
            onClick={onCancel}
            disabled={processingPayment || creatingBooking}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Message when no time is selected */}
      {!selectedTime && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">Please select a time to proceed with payment</p>
        </div>
      )}
    </div>
  );
};
