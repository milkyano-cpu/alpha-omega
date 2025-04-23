"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { TimeSlot } from "@/lib/booking-service";

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

interface BookingSummaryProps {
  selectedService: Service | null;
  selectedTime: TimeSlot | null;
  error: string | null;
  onProceedToPayment: () => void;
  showPaymentForm: boolean;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedService,
  selectedTime,
  error,
  onProceedToPayment,
  showPaymentForm,
}) => {
  if (!selectedService) return null;

  // Display doubled price for customer, but deposit is still the actual price in Square
  const servicePrice = selectedService ? selectedService.price_amount / 100 : 0;
  const totalAmount = servicePrice * 2; // Display double the price
  const depositAmount = servicePrice; // Deposit is the original price (50% of displayed doubled price)

  // Format time for display
  const formatTime = (isoTime: string) => {
    const time = new Date(isoTime);
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date for display
  const formatDate = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="mb-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <p className="text-sm font-medium">{selectedService.name}</p>
          <div className="flex gap-3 text-xs text-gray-600">
            <span>${totalAmount.toFixed(2)}</span>
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
          <p className="font-medium">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="p-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm">Deposit (50%)</p>
          <p className="font-medium">${depositAmount.toFixed(2)}</p>
        </div>
        <div className="p-3 border-t border-gray-100 flex justify-between items-center text-gray-500 text-sm">
          <p>Balance due at appointment</p>
          <p>${depositAmount.toFixed(2)}</p>
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
              {formatDate(selectedTime.start_at)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 border border-red-400 bg-red-50 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!showPaymentForm && (
        <Button
        onClick={onProceedToPayment}
        className="w-full mt-4 py-3 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-md font-normal"
          disabled={!selectedTime}
        >
          {selectedTime ? "Confirm and Pay Deposit" : "Please Select a Time"}
          </Button>
      )}
    </div>
  );
};
