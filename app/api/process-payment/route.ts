import { NextRequest, NextResponse } from "next/server";
import { Client, Environment } from "square";

// Square client configuration
const square = new Client({
  environment: Environment.Production,
  accessToken: process.env.SQUARE_ACCESS_TOKEN || "",
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { sourceId, amount, idempotencyKey, locationId, customerDetails } =
      body;

    if (!sourceId || !amount || !idempotencyKey || !locationId) {
      return NextResponse.json(
        { success: false, message: "Missing required payment information" },
        { status: 400 }
      );
    }

    // Create payment with Square API
    const paymentRequest: any = {
      sourceId,
      amountMoney: {
        amount: BigInt(Math.round(amount)), // Square expects the amount in cents
        currency: "AUD",
      },
      locationId,
      idempotencyKey,
      note: "Alpha Omega Barber Shop - Appointment Deposit",
      statementDescriptionIdentifier: "ALPHAOMEGA",
    };

    // Add customer details if available
    if (customerDetails?.squareCustomerId) {
      paymentRequest.customerId = customerDetails.squareCustomerId;
    }

    console.log(
      "Payment request:",
      JSON.stringify(paymentRequest, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    const response = await square.paymentsApi.createPayment(paymentRequest);

    // Return success response with payment details
    return NextResponse.json({
      success: true,
      payment: {
        id: response.result.payment?.id,
        status: response.result.payment?.status,
        receiptUrl: response.result.payment?.receiptUrl,
      },
    });
  } catch (error: any) {
    console.error("Payment processing error:", error);

    // Log detailed error information for debugging
    if (error && error.response) {
      console.error(
        "Square API response error:",
        error.response.status,
        error.response.data
      );
    } else if (error && error.request) {
      console.error("No response received from Square API");
    }

    // Format Square API errors if available
    let errorMessage = "Payment processing failed";
    let errorDetails = null;

    if (error && error.errors && Array.isArray(error.errors)) {
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
