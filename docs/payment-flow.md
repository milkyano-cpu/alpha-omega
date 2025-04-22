# Alpha Omega Barber Shop - Payment Flow

This document outlines the payment flow implementation for the Alpha Omega Barber Shop booking system.

## Overview

The payment flow allows customers to:
1. Select a barber and service
2. Choose an available appointment time
3. Pay a 50% deposit using Square Web Payments SDK
4. Confirm their booking after successful payment
5. View a booking confirmation with details and payment receipt

## Technical Implementation

### Square Web Payments SDK Integration

The application integrates with Square Web Payments SDK to process card payments securely. The integration involves:

1. **Loading the SDK**: The Square SDK is loaded in the app layout file
2. **Card Form**: A card input form is displayed after user selects "Proceed to Payment"
3. **Tokenization**: The card details are tokenized for secure processing
4. **Payment Processing**: The payment is processed via a Next.js API route
5. **Booking Creation**: After successful payment, the booking is created in the backend

### Key Components

1. **Payment Form**: Implemented in the appointment page
2. **Process Payment API**: Handles the communication with Square API
3. **Booking Confirmation**: Saves and displays booking details

## Payment Flow Sequence

1. User selects a service and time slot
2. User clicks "Proceed to Payment"
3. Card form appears and user enters payment details
4. On submission, card details are tokenized by Square SDK
5. Token is sent to server for payment processing
6. Upon successful payment, booking is created
7. User is redirected to confirmation page with booking details

## Implementation Notes

- Only 50% of the service price is charged as a deposit
- The remaining balance is to be paid at the appointment
- Payment is processed in AUD currency
- Square Sandbox environment is used for testing
- A customer note is added to the booking to indicate deposit payment

## Environment Setup

The implementation uses the following Square credentials for the Sandbox environment:
- Application ID: `sandbox-sq0idb-P_U19QHlNsZi7N9qLb0rAg`
- Location ID: `L87WGNMM3QSAP`
- Access Token: `sandbox-sq0atb-T33zq3_zCL8e68T0CqTptA`

For production deployment, these should be replaced with production credentials stored in environment variables.
