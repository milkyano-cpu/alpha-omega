import { NextRequest, NextResponse } from "next/server";
import { Client, Environment } from "square";

// Square client configuration - reuse the same client from payment processing
const square = new Client({
  // environment: Environment.Production,
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN || "",
});

// Maximum retry attempts for creating a booking
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Helper function to add delay between retries
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      serviceVariationId,
      teamMemberId,
      customerId,
      startAt,
      serviceVariationVersion,
      customerNote,
      idempotencyKey,
      locationId,
    } = body;

    if (
      !serviceVariationId ||
      !teamMemberId ||
      !startAt ||
      !idempotencyKey ||
      !locationId
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required booking information" },
        { status: 400 }
      );
    }

    // Determine duration in minutes from service variation version data or use default
    const durationMinutes = 30; // Default duration

    // Prepare Square booking request
    const bookingRequest = {
      idempotencyKey,
      booking: {
        startAt,
        locationId,
        customerId,
        customerNote,
        appointmentSegments: [
          {
            serviceVariationId,
            teamMemberId,
            durationMinutes,
            serviceVariationVersion: serviceVariationVersion
              ? BigInt(serviceVariationVersion)
              : undefined,
          },
        ],
      },
    };

    // Log the booking request (redact sensitive information)
    console.log(
      "Square booking request:",
      JSON.stringify(
        {
          ...bookingRequest,
          booking: {
            ...bookingRequest.booking,
            customerId: customerId ? "[REDACTED]" : undefined,
          },
        },
        (_, value) => (typeof value === "bigint" ? value.toString() : value)
      )
    );

    // Implement retry logic
    let lastError = null;
    let bookingResult = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await square.bookingsApi.createBooking(bookingRequest);
        bookingResult = response.result;
        break; // Success, exit the retry loop
      } catch (error: any) {
        lastError = error;
        console.error(`Booking creation attempt ${attempt} failed:`, error);

        // Only retry if not the last attempt
        if (attempt < MAX_RETRIES) {
          // Add progressive delay between retries
          await delay(RETRY_DELAY_MS * attempt);

          // If the error is due to idempotency key collision, just return success
          if (
            error?.errors?.some(
              (err: any) => err.code === "IDEMPOTENCY_KEY_ALREADY_USED"
            )
          ) {
            return NextResponse.json({
              success: true,
              message: "Booking already exists with this idempotency key",
              booking: null,
              isRetry: true,
            });
          }
        }
      }
    }

    // If all retries failed, throw the last error
    if (!bookingResult) {
      throw lastError || new Error("All booking creation attempts failed");
    }

    // Return success with booking details
    return NextResponse.json({
      success: true,
      booking: {
        id: bookingResult.booking?.id,
        status: bookingResult.booking?.status,
        startAt: bookingResult.booking?.startAt,
        locationId: bookingResult.booking?.locationId,
        customerId: bookingResult.booking?.customerId,
        createdAt: bookingResult.booking?.createdAt,
        version: bookingResult.booking?.version?.toString(),
      },
    });
  } catch (error: any) {
    console.error("Square booking creation error:", error);

    // Format error response
    let errorMessage = "Booking creation failed";
    let errorDetails = null;

    if (error?.errors && Array.isArray(error.errors)) {
      errorDetails = error.errors;
      errorMessage = error.errors[0]?.detail || errorMessage;
      // Log individual errors for debugging
      error.errors.forEach((err: any, index: number) => {
        console.error(`Square error ${index + 1}:`, err);
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
