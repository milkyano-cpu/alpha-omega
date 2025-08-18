"use client";

import { Button } from "@/components/ui/button";
import { TimeSlot, Service } from "@/lib/booking-service";
import React, { useEffect, useRef, useState } from "react";

interface PaymentFormProps {
  squareCard: Square.Card | null;
  selectedService: Service | null;
  selectedTime: TimeSlot | null;
  processingPayment: boolean;
  creatingBooking?: boolean;
  paymentError: string | null;
  handlePayment: () => Promise<void>;
  onCancelPayment: () => void;
  selectedServices?: Service[];
  onSquareCardReady?: (card: Square.Card) => void;
  onSquareCardError?: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  squareCard,
  selectedService,
  selectedTime,
  processingPayment,
  creatingBooking = false,
  paymentError,
  handlePayment,
  onCancelPayment,
  selectedServices = [],
  onSquareCardReady,
  onSquareCardError,
}) => {
  // Debug: Track component mounting/unmounting
  React.useEffect(() => {
    console.log('🔄 PaymentForm component mounted');
    return () => {
      console.log('💀 PaymentForm component unmounted');
    };
  }, []);

  // Debug: Track prop changes that might cause re-renders
  React.useEffect(() => {
    console.log('🔍 PaymentForm props changed:', {
      selectedService: selectedService?.id,
      selectedTime: selectedTime?.start_at,
      selectedServices: selectedServices.length,
      processingPayment,
      creatingBooking,
      squareCard: !!squareCard
    });
  }, [selectedService, selectedTime, selectedServices, processingPayment, creatingBooking, squareCard]);

  const cardContainerRef = useRef<HTMLDivElement>(null);
  const squareCardRef = useRef<Square.Card | null>(null);
  const initializationAttempted = useRef(false);
  const cleanupAttempted = useRef(false);
  const paymentInProgressRef = useRef(false); // Track if payment is in progress
  const [squareInitialized, setSquareInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  // Use a static container ID that doesn't change on re-renders
  const containerId = useRef(`square-card-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Track if component is mounted to prevent cleanup conflicts
  const isMountedRef = useRef(true);

  // Store callbacks in refs to prevent dependency changes
  const onSquareCardReadyRef = useRef(onSquareCardReady);
  const onSquareCardErrorRef = useRef(onSquareCardError);
  
  useEffect(() => {
    onSquareCardReadyRef.current = onSquareCardReady;
    onSquareCardErrorRef.current = onSquareCardError;
  }, [onSquareCardReady, onSquareCardError]);

  // Memoized initialization function to prevent unnecessary re-runs
  const initializeSquarePayment = React.useCallback(async () => {
    try {
      // Wait for Square SDK to load in production with retries
      let retries = 0;
      const maxRetries = 10;
      while (!window.Square && retries < maxRetries) {
        console.log(`Waiting for Square SDK to load (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
      
      // Ensure Square SDK is loaded
      if (!window.Square) {
        throw new Error(`Square.js failed to load after ${maxRetries} attempts. Check network connection and environment.`);
      }
      
      console.log('✅ Square SDK loaded successfully');

      // Check environment variables with fallbacks
      const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID || "";
      const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";

      console.log('🔑 Square credentials check:', { 
        appId: appId ? `${appId.substring(0, 10)}...` : 'MISSING', 
        locationId: locationId ? `${locationId.substring(0, 10)}...` : 'MISSING',
        environment: process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'MISSING',
        isProduction: process.env.NODE_ENV === 'production',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });

      if (!appId || !locationId) {
        throw new Error(`Missing Square credentials: appId=${!!appId}, locationId=${!!locationId}`);
      }

      // Ensure DOM element exists and is ready
      if (!cardContainerRef.current) {
        throw new Error('Card container ref not available');
      }

      // Set the container ID immediately
      const currentContainerId = containerId.current;
      cardContainerRef.current.id = currentContainerId;
      
      console.log('Setting up Square payments with container ID:', currentContainerId);
      
      // Verify the element is in the DOM and stable
      if (!document.body.contains(cardContainerRef.current)) {
        throw new Error('Card container not in DOM');
      }
      
      // Initialize Square payments
      const payments = window.Square.payments(appId, locationId);
      const card = await payments.card();

      // Final verification before attachment
      const domElement = document.getElementById(currentContainerId);
      if (!domElement || domElement !== cardContainerRef.current || !document.body.contains(domElement)) {
        throw new Error('DOM element verification failed or element not in DOM');
      }
      
      console.log('Attaching Square card to container:', currentContainerId);
      
      // Use a try-catch specifically for the attach operation
      try {
        await card.attach(`#${currentContainerId}`);
      } catch (attachError: any) {
        console.error('Square card attachment failed:', attachError);
        // Clean up the card object if attachment failed
        try {
          card.destroy();
        } catch {
          // Ignore destroy errors during attachment failure
        }
        throw new Error(`Square card attachment failed: ${attachError.message}`);
      }
      
      // Store the card reference
      squareCardRef.current = card;
      setSquareInitialized(true);
      setInitError(null);
      onSquareCardReadyRef.current?.(card);
      console.log('✅ Square payment form initialized successfully');
    } catch (error: any) {
      console.error("Error initializing Square Payment:", error);
      setInitError(error.message);
      onSquareCardErrorRef.current?.(error.message || "Failed to initialize payment form. Please try again.");
    }
  }, []); // Empty dependency array - stable function

  // Use useEffect with delay and window check for production compatibility
  useEffect(() => {
    // Skip if not in browser environment (SSR)
    if (typeof window === 'undefined') {
      console.log('Skipping Square initialization - not in browser environment');
      return;
    }
    
    // CRITICAL: Prevent re-initialization if Square is already initialized successfully
    if (initializationAttempted.current || squareInitialized || squareCardRef.current) {
      console.log('⚠️ Skipping Square initialization - already initialized', {
        initializationAttempted: initializationAttempted.current,
        squareInitialized,
        hasSquareCard: !!squareCardRef.current
      });
      return;
    }
    
    initializationAttempted.current = true;
    console.log('PaymentForm useEffect - initializing Square payment');
    
    // Capture container ID value at effect creation to avoid ref staleness warning
    const currentContainerIdForCleanup = containerId.current;
    
    // Add delay for production compatibility (SSR/hydration + DOM stability)
    // Use longer delay in production to ensure everything is ready
    const isProduction = process.env.NODE_ENV === 'production';
    const initDelay = isProduction ? 1000 : 200; // Longer delay for production
    
    console.log(`🚀 Initializing Square payment in ${isProduction ? 'production' : 'development'} mode with ${initDelay}ms delay`);
    
    const initTimer = setTimeout(() => {
      if (isMountedRef.current && typeof window !== 'undefined') {
        initializeSquarePayment();
      }
    }, initDelay);
    
    // Cleanup function
    return () => {
      console.log('PaymentForm cleanup triggered');
      isMountedRef.current = false;
      clearTimeout(initTimer);
      
      // Prevent duplicate cleanup attempts
      if (cleanupAttempted.current) {
        console.log('Cleanup already attempted, skipping');
        return;
      }
      cleanupAttempted.current = true;
      
      if (squareCardRef.current) {
        try {
          // Check if payment is in progress - if so, delay cleanup
          if (paymentInProgressRef.current) {
            console.log('Payment in progress, delaying Square card cleanup');
            // Schedule cleanup for later
            setTimeout(() => {
              if (squareCardRef.current && !paymentInProgressRef.current) {
                try {
                  console.log('Delayed cleanup: Destroying Square payment form');
                  squareCardRef.current.destroy();
                  squareCardRef.current = null;
                } catch (e: any) {
                  console.error("Error in delayed Square cleanup:", e);
                }
              }
            }, 1000);
            return;
          }
          
          console.log('Destroying Square payment form');
          
          // Check if the DOM element still exists before Square cleanup
          const domElement = document.getElementById(currentContainerIdForCleanup);
          if (domElement && document.body.contains(domElement)) {
            console.log('DOM element found, proceeding with Square cleanup');
            squareCardRef.current.destroy();
          } else {
            console.log('DOM element not found, skipping Square cleanup to prevent React conflict');
          }
          
          squareCardRef.current = null;
        } catch (e: any) {
          console.error("Error destroying Square payment form:", e);
          // Don't rethrow - let cleanup continue
        }
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setSquareInitialized(false);
        initializationAttempted.current = false;
      }
    };
  }, [initializeSquarePayment, squareInitialized]);

  // Additional cleanup effect to handle component unmounting
  useEffect(() => {
    // Capture container ID for cleanup
    const containerIdForUnmount = containerId.current;
    
    return () => {
      console.log('PaymentForm component unmounting');
      isMountedRef.current = false;
      
      // If Square card still exists, clean it up safely (only if payment not in progress)
      if (squareCardRef.current && !cleanupAttempted.current) {
        try {
          // Don't destroy card if payment is in progress
          if (paymentInProgressRef.current) {
            console.log('Payment in progress during unmount, skipping card destruction');
            return;
          }
          
          const domElement = document.getElementById(containerIdForUnmount);
          if (domElement && document.body.contains(domElement)) {
            squareCardRef.current.destroy();
          }
          squareCardRef.current = null;
        } catch (e) {
          console.error("Error in unmount cleanup:", e);
        }
        cleanupAttempted.current = true;
      }
    };
  }, []); // Empty dependency array - only run on unmount

  // Track payment status to prevent cleanup during payment
  useEffect(() => {
    paymentInProgressRef.current = processingPayment || creatingBooking || false;
  }, [processingPayment, creatingBooking]);

  if (!selectedService || !selectedTime) return null;

  // Calculate card fee from full subtotal, entire fee goes to deposit
  const subtotalAmount = selectedServices.reduce(
    (total, service) => total + (service.price_amount / 100),
    0
  );
  const cardFee = subtotalAmount * 0.022; // 2.2% card fee on full subtotal
  const baseDepositAmount = subtotalAmount * 0.5; // 50% deposit of services
  const depositAmount = baseDepositAmount + cardFee; // Deposit + entire card fee
  const totalAmount = subtotalAmount + cardFee; // Total including card fee
  // const balanceAmount = subtotalAmount - baseDepositAmount; // Balance due (exactly 50% of subtotal)
  
  // Individual service deposits for display (not currently used in UI)
  // const mainServiceDeposit = mainServicePrice * 0.5;
  // const additionalServiceDeposits = additionalServices.map(
  //   (additionalService) => (additionalService.service.price_amount / 100) * 0.5
  // );

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
            <strong>Secure Payment</strong>: Your card information is processed
            securely by Square. The remaining balance will be collected at the
            barbershop.
          </p>
        </div>
        <p className="text-xl font-medium mb-4">
          ${depositAmount.toFixed(2)} AUD
        </p>

        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {paymentError}
          </div>
        )}

        <div
          ref={cardContainerRef}
          id={containerId.current}
          className="mb-5 border rounded-md p-3 min-h-[140px] relative"
        >
          {!squareInitialized && !initError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading payment form...</span>
              </div>
            </div>
          )}
          {initError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-md">
              <div className="text-center p-4">
                <p className="text-sm text-red-600 mb-2">Payment form failed to load</p>
                <p className="text-xs text-gray-600 mb-3">
                  {initError.includes('Square.js failed to load') 
                    ? 'The payment system is not available. This might be a network issue.'
                    : 'There was an issue initializing the payment form.'
                  }
                </p>
                <button 
                  onClick={() => {
                    console.log('🔄 Retrying Square payment initialization');
                    setInitError(null);
                    setSquareInitialized(false);
                    initializationAttempted.current = false;
                    cleanupAttempted.current = false;
                    // Reset the mounted ref to allow re-initialization
                    isMountedRef.current = true;
                    // This will trigger re-initialization on next render
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline mr-2"
                >
                  Try again
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Refresh page
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3">
          {/* Selected Services */}
          {selectedServices.map((service, index) => (
            <div key={service.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {service.name}{index === 0 && selectedServices.length > 1 ? ' (Primary)' : ''}:
              </span>
              <span className="font-medium">${(service.price_amount / 100).toFixed(2)} AUD</span>
            </div>
          ))}
          
          <div className="border-t border-gray-200 pt-2 mt-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotalAmount.toFixed(2)} AUD</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Card Payment Fee (2.2%):</span>
              <span className="font-medium">${cardFee.toFixed(2)} AUD</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">${totalAmount.toFixed(2)} AUD</span>
            </div>
          </div>
          
          <div className="bg-gray-50 border-t border-gray-200 pt-2 mt-1 flex items-center justify-between">
            <span className="font-medium">Deposit Payment (50%):</span>
            <span className="font-bold">${depositAmount.toFixed(2)} AUD</span>
          </div>
        </div>

        <Button
          className="w-full py-3 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-md font-normal mt-4"
          onClick={() => {
            // Mark payment as starting to prevent card destruction
            paymentInProgressRef.current = true;
            handlePayment();
          }}
          disabled={processingPayment || !squareCard || creatingBooking || !squareInitialized || !!initError}
        >
          {processingPayment ? "Processing Payment..." : 
           creatingBooking ? "Creating Booking..." : 
           !squareInitialized ? "Initializing Payment..." :
           initError ? "Payment System Error" :
           "Pay Deposit Now"}
        </Button>

        <p className="text-xs text-gray-500 mt-2 text-center">
          By proceeding with payment, you agree to our{" "}
          <a href="#" className="underline">
            Terms of Service
          </a>
        </p>

        <button
          type="button"
          className="w-full mt-2 text-sm text-gray-500 hover:underline"
          onClick={onCancelPayment}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
