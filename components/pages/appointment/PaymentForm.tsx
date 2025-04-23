"use client";

import React, { useEffect } from "react";
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

interface PaymentFormProps {
  squareCard: Square.Card | null;
  selectedService: Service | null;
  selectedTime: TimeSlot | null;
  processingPayment: boolean;
  paymentError: string | null;
  handlePayment: () => Promise<void>;
  onCancelPayment: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  squareCard,
  selectedService,
  selectedTime,
  processingPayment,
  paymentError,
  handlePayment,
  onCancelPayment,
}) => {
  if (!selectedService || !selectedTime) return null;

  // The deposit amount is the actual price in Square
  // This is 50% of the doubled price shown to customers
  const depositAmount = selectedService.price_amount / 100;

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
            <strong>Secure Payment</strong>: Your card information is
            processed securely by Square. The remaining balance will be
            collected at the barbershop.
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
          id="card-container"
          className="mb-5 border rounded-md p-3 min-h-[140px]"
        ></div>

        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Deposit Amount:</span>
            <span className="font-medium">
              ${depositAmount.toFixed(2)} AUD
            </span>
          </div>
          <div className="bg-gray-50 border-t border-gray-200 pt-2 mt-1 flex items-center justify-between">
            <span className="font-medium">Total Payment:</span>
            <span className="font-bold">
              ${depositAmount.toFixed(2)} AUD
            </span>
          </div>
        </div>

        <Button
          className="w-full py-3 text-base bg-blue-500 hover:bg-blue-600 text-white rounded-md font-normal mt-4"
          onClick={handlePayment}
          disabled={processingPayment || !squareCard}
        >
          {processingPayment ? "Processing..." : "Pay Deposit Now"}
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
