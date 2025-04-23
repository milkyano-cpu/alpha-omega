# Appointment Booking Components

This directory contains components for the Alpha Omega barbershop appointment booking system.

## Overview

The appointment booking flow is designed to be intuitive and straightforward:

1. User selects a service and barber on the services page
2. User selects a date and time on the appointment page
3. User reviews booking details and confirms booking intention
4. User pays the deposit (50% of service price)
5. System automatically creates the booking upon successful payment
6. User is redirected to a confirmation/thank you page

## Components

### `DateTimeSelector`

Handles selection of appointment date and time:
- Displays a calendar for date selection
- Shows available time slots for the selected date
- Handles loading states elegantly
- Provides clear feedback when no times are available

### `BookingSummary`

Displays a summary of the booking details:
- Shows service name, duration, and price
- Displays the selected date and time
- Shows deposit amount (50%) and remaining balance
- Includes a "Confirm and Pay Deposit" button that is disabled until a time is selected

### `PaymentForm`

Manages the payment process:
- Integrates with Square Web Payments SDK
- Handles secure card tokenization
- Provides clear feedback during payment processing
- Shows appropriate error messages if payment fails

## Key Changes from Previous Implementation

1. **Improved User Flow**: Changed from "Select → Pay → Confirm" to "Select → Confirm & Pay" for a more intuitive experience
2. **Automatic Booking Creation**: System now automatically creates the booking after successful payment
3. **Component Separation**: Extracted UI components for better code organization and maintainability
4. **Improved Error Handling**: Better feedback for various error conditions
5. **Streamlined UX**: Reduced unnecessary steps and waiting times

## Implementation Details

The main page orchestrates the flow between these components, managing:
- Data fetching for available times
- Payment processing with Square
- Booking creation with the booking service
- Status updates and redirects

Each component is focused on its specific responsibility, making the code more maintainable and easier to test.

## Usage

Import and use these components from the main appointment page:

```tsx
import { 
  DateTimeSelector, 
  BookingSummary, 
  PaymentForm 
} from "@/components/pages/appointment";
```

The parent page is responsible for managing state and providing the necessary props to each component.
