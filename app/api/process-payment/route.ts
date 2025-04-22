import { NextRequest, NextResponse } from 'next/server';
import { Client, Environment } from 'square';

// Square client configuration
const square = new Client({
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN || 'sandbox-sq0atb-T33zq3_zCL8e68T0CqTptA',
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { sourceId, amount, idempotencyKey, locationId, customerDetails } = body;
    
    if (!sourceId || !amount || !idempotencyKey || !locationId) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Create payment with Square API
    const paymentRequest: any = {
      sourceId,
      amountMoney: {
        amount: BigInt(Math.round(amount)), // Square expects the amount in cents
        currency: 'AUD',
      },
      locationId,
      idempotencyKey,
      note: 'Alpha Omega Barber Shop - Appointment Deposit',
      statementDescriptionIdentifier: 'ALPHAOMEGA',
    };

    // Add customer details if available
    if (customerDetails?.squareCustomerId) {
      paymentRequest.customerId = customerDetails.squareCustomerId;
    }

    // If using buyer-provided verification info, include that
    if (customerDetails?.verificationToken) {
      paymentRequest.verificationToken = customerDetails.verificationToken;
    }

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
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Format Square API errors if available
    let errorMessage = 'Payment processing failed';
    let errorDetails = null;
    
    if (error.errors && Array.isArray(error.errors)) {
      errorDetails = error.errors;
      errorMessage = error.errors[0]?.detail || errorMessage;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        details: errorDetails 
      },
      { status: 500 }
    );
  }
}