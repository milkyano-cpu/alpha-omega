'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { VerificationGuard } from '@/components/verification-guard';

interface BookingDetails {
  id: number;
  service: string;
  date: string;
  time: string;
  deposit: string;
  total: string;
  status: string;
}

interface PaymentReceipt {
  receiptUrl?: string;
  paymentId?: string;
  amount?: string;
  currency?: string;
  idempotencyKey?: string;
  squareBookingId?: string;
}

export default function ThankYou() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(
    null
  );
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceipt | null>(
    null
  );
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Get the booking details from localStorage
    const lastBookingStr = localStorage.getItem('lastBooking');
    if (lastBookingStr) {
      try {
        const lastBooking = JSON.parse(lastBookingStr) as BookingDetails;
        setBookingDetails(lastBooking);

        // Format the date to be more readable
        if (lastBooking.date) {
          try {
            const date = new Date(lastBooking.date);
            const options: Intl.DateTimeFormatOptions = {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            };
            setFormattedDate(date.toLocaleDateString('en-US', options));
          } catch (dateErr) {
            // If date formatting fails, use the original date string
            setFormattedDate(lastBooking.date);
            console.error('Error formatting date:', dateErr);
          }
        }
      } catch (err) {
        console.error('Error parsing booking details:', err);
      }
    }

    // Get payment receipt details
    const paymentReceiptStr = localStorage.getItem('paymentReceipt');
    if (paymentReceiptStr) {
      try {
        const receipt = JSON.parse(paymentReceiptStr) as PaymentReceipt;
        setPaymentReceipt(receipt);
      } catch (err) {
        console.error('Error parsing payment receipt:', err);
      }
    }

    // Clear the booking details after we've loaded them
    // to prevent showing old booking details on page refresh
    return () => {
      localStorage.removeItem('lastBooking');
      localStorage.removeItem('paymentReceipt');
    };
  }, [isAuthenticated, router]);

  return (
    <VerificationGuard requireVerification={true}>
      <main className='flex flex-col gap-20 mt-30'>
      <section className='container mx-auto flex flex-col items-center justify-center text-center py-20 px-4'>
        <div className='w-full max-w-md bg-white rounded-lg shadow-lg p-8'>
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-10 w-10 text-green-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>

          <h1 className='text-3xl font-bold mb-4'>Booking Confirmed!</h1>

          <p className='text-lg mb-6'>
            Thank you for choosing Alpha Omega, {user?.first_name}.
            {bookingDetails?.status === 'payment_received'
              ? ' Your payment has been processed successfully!'
              : ' Your appointment has been successfully booked and confirmed!'}
          </p>

          {bookingDetails && (
            <div className='mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-left'>
              <h2 className='font-bold text-xl mb-2 text-center'>
                Booking Details
              </h2>

              {bookingDetails.status === 'payment_received' && (
                <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm'>
                  <p className='font-bold mb-1'>Important Notice:</p>
                  <p>
                    Your payment was processed successfully, but we encountered
                    an issue finalizing your booking. Our team has been notified
                    and will confirm your appointment shortly.
                  </p>
                </div>
              )}

              {paymentReceipt && paymentReceipt.receiptUrl && (
                <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm'>
                  <p className='font-bold mb-1'>Payment Receipt:</p>
                  <p>
                    Your payment has been processed successfully.{' '}
                    <Link
                      href={paymentReceipt.receiptUrl}
                      target='_blank'
                      className='text-blue-600 underline font-medium'
                    >
                      View Receipt
                    </Link>
                  </p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-2 text-sm'>
                <p className='text-gray-600'>Service:</p>
                <p className='font-medium'>{bookingDetails.service}</p>

                <p className='text-gray-600'>Date:</p>
                <p className='font-medium'>
                  {formattedDate || bookingDetails.date}
                </p>

                <p className='text-gray-600'>Time:</p>
                <p className='font-medium'>{bookingDetails.time}</p>

                <p className='text-gray-600'>Deposit Paid:</p>
                <p className='font-medium'>${bookingDetails.deposit} AUD</p>

                <p className='text-gray-600'>Total Price:</p>
                <p className='font-medium'>${bookingDetails.total} AUD</p>

                <p className='text-gray-600'>Balance Due:</p>
                <p className='font-medium'>
                  $
                  {(
                    parseFloat(bookingDetails.total) -
                    parseFloat(bookingDetails.deposit)
                  ).toFixed(2)}{' '}
                  AUD
                </p>

                <p className='text-gray-600'>Booking Status:</p>
                <p
                  className={`font-medium capitalize ${
                    bookingDetails.status === 'payment_received'
                      ? 'text-yellow-600'
                      : ''
                  }`}
                >
                  {bookingDetails.status === 'payment_received'
                    ? 'Processing'
                    : bookingDetails.status}
                </p>
              </div>

              <p className='text-xs text-gray-500 mt-2'>
                (Displayed prices show the full service amount. 50% deposit has
                been paid.)
              </p>

              {paymentReceipt && paymentReceipt.paymentId && (
                <div className='grid grid-cols-2 gap-2 text-sm mt-2'>
                  <p className='text-gray-600'>Payment ID:</p>
                  <p className='font-medium text-xs break-all'>
                    {paymentReceipt.paymentId}
                  </p>
                </div>
              )}

              <div className='mt-4'>
                <h3 className='font-semibold text-lg mb-2 text-center'>
                  Our Location
                </h3>
                <div style={{ width: '100%' }}>
                  <iframe
                    width='100%'
                    height='300'
                    frameBorder={0}
                    scrolling='no'
                    marginHeight={0}
                    marginWidth={0}
                    src='https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=104%20Greville%20street,%20Prahran,%20+(Alpha%20Omega%20Mens%20Grooming)&amp;t=&amp;z=13&amp;ie=UTF8&amp;iwloc=B&amp;output=embed'
                  >
                    <a href='https://www.gps.ie/collections/personal-trackers/'>
                      real-time gps tracker,
                    </a>
                  </iframe>
                </div>
                <p className='text-sm text-center mt-2 font-medium'>
                  55 Portman St, Oakleigh VIC 3166, Australia
                </p>
              </div>
            </div>
          )}

          <p className='mb-8 text-gray-600'>
            {bookingDetails?.status === 'payment_received' ? (
              <>
                Your payment has been received and our team is processing your
                booking. You will receive a confirmation email soon.
                <br />
                <br />
                <strong>Please note:</strong> If you don&apos;t receive a
                confirmation within 24 hours, please contact us.
              </>
            ) : (
              <>
                You will receive a confirmation email with the details of your
                appointment. Please arrive 10 minutes before your scheduled
                time.
                <br />
                <br />
                <strong>Remember:</strong> Please pay the remaining balance at
                the barbershop.
              </>
            )}
          </p>

          <div className='flex flex-col gap-4'>
            {paymentReceipt && paymentReceipt.receiptUrl && (
              <Button
                onClick={() => window.open(paymentReceipt.receiptUrl, '_blank')}
                variant='secondary'
                className='w-full'
              >
                View Payment Receipt
              </Button>
            )}

            <Button
              onClick={() => router.push('/book/services')}
              variant='outline'
              className='w-full'
            >
              Book Another Appointment
            </Button>

            <Button onClick={() => router.push('/')} className='w-full'>
              Return to Home
            </Button>
          </div>
        </div>
      </section>
    </main>
    </VerificationGuard>
  );
}
