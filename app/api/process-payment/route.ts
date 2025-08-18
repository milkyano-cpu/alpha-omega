import { NextRequest, NextResponse } from 'next/server';
import { Client, Environment } from 'square';

// Determine Square environment based on env variable
const isProduction = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production';
const squareEnvironment = isProduction ? Environment.Production : Environment.Sandbox;

// Square client configuration - Environment determined by NEXT_PUBLIC_SQUARE_ENVIRONMENT
const square = new Client({
  environment: squareEnvironment,
  accessToken: process.env.SQUARE_ACCESS_TOKEN || ''
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { sourceId, amount, idempotencyKey, locationId } =
      body;

    if (!sourceId || !amount || !idempotencyKey || !locationId) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Create payment with Square API - v39.1.1 format (camelCase)
    const paymentRequest: any = {
      sourceId,
      amountMoney: {
        amount: BigInt(Math.round(amount)), // Square expects the amount in cents
        currency: 'AUD'
      },
      locationId,
      idempotencyKey,
      note: 'Alpha Omega Barber Shop - Appointment Deposit',
      statementDescriptionIdentifier: 'ALPHAOMEGA'
    };

    // Temporarily disable customer ID to debug Square API issue
    // if (customerDetails?.squareCustomerId) {
    //   paymentRequest.customerId = customerDetails.squareCustomerId;
    // }

    console.log(
      'Payment request:',
      JSON.stringify(paymentRequest, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    const response = await square.paymentsApi.createPayment(paymentRequest);

    // Create local payment record via webhook immediately after payment
    if (response.result.payment && body.userToken) {
      try {
        console.log('🔗 Creating local payment record via webhook...');
        const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/webhook/square-payment-success`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${body.userToken}`
          },
          body: JSON.stringify({
            square_payment_id: response.result.payment.id,
            amount_cents: Number(amount),
            currency: 'AUD',
            receipt_url: response.result.payment.receiptUrl || null
          })
        });

        if (webhookResponse.ok) {
          const webhookData = await webhookResponse.json();
          console.log('✅ Local payment record created successfully:', webhookData);
        } else {
          const errorData = await webhookResponse.json();
          console.error('❌ Webhook failed:', errorData);
        }
      } catch (error) {
        console.error('❌ Error calling payment webhook:', error);
        // Don't fail the payment if local record creation fails
      }
    }

    // Return success response with payment details
    return NextResponse.json({
      success: true,
      payment: {
        id: response.result.payment?.id,
        status: response.result.payment?.status,
        receiptUrl: response.result.payment?.receiptUrl
      }
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);

    // Log detailed error information for debugging
    if (error && error.response) {
      console.error(
        'Square API response error:',
        error.response.status,
        error.response.data
      );
    } else if (error && error.request) {
      console.error('No response received from Square API');
    }

    // Format Square API errors if available
    let errorMessage = 'Payment processing failed';
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
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
