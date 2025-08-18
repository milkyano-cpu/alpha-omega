"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { TimeSlot, Service } from "@/lib/booking-service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

interface BookingSummaryProps {
  selectedService: Service | null;
  selectedTime: TimeSlot | null;
  error: string | null;
  onProceedToPayment: () => void;
  showPaymentForm: boolean;
  selectedServices?: Service[];
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedService,
  selectedTime,
  error,
  onProceedToPayment,
  showPaymentForm,
  selectedServices = [],
}) => {
  if (!selectedService) return null;

  // Calculate total pricing for all selected services
  const subtotalAmount = selectedServices.reduce((total, service) => {
    return total + (service.price_amount / 100);
  }, 0);
  const cardFee = subtotalAmount * 0.022; // 2.2% card fee on full subtotal
  const baseDepositAmount = subtotalAmount * 0.5; // 50% deposit of services
  const depositAmount = baseDepositAmount + cardFee; // Deposit + entire card fee
  const totalAmount = subtotalAmount + cardFee; // Total including card fee
  const balanceAmount = subtotalAmount - baseDepositAmount; // Balance due (exactly 50% of subtotal)

  // Format time for display in Melbourne timezone (for Australian users)
  const formatTime = (isoTime: string) => {
    // Convert UTC time to Melbourne time
    const melbourneTime = dayjs(isoTime).tz("Australia/Melbourne");
    return melbourneTime.format("h:mm A");
  };

  // Format date for display in Melbourne timezone (for Australian users)
  const formatDate = (isoTime: string) => {
    // Convert UTC time to Melbourne time
    const melbourneDate = dayjs(isoTime).tz("Australia/Melbourne");
    return melbourneDate.format("dddd, MMM D");
  };

  return (
    <div className="mb-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Selected Services */}
        {selectedServices.map((service, index) => (
          <div key={`${service.id}-${index}`} className={`p-3 border-b border-gray-200 flex justify-between items-center ${
            index === 0 ? 'bg-gray-50' : 'bg-blue-50'
          }`}>
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

        {/* Totals */}
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
        className="w-full mt-4 py-3 text-base bg-black hover:bg-gray-800 transition-colors text-white rounded-md font-normal"
          disabled={!selectedTime}
        >
          {selectedTime ? "Confirm and Pay Deposit" : "Please Select a Time"}
          </Button>
      )}
    </div>
  );
};
