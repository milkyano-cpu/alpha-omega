"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { BookingService } from "@/lib/booking-service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast, { Toaster } from 'react-hot-toast';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Payment {
  id: number;
  amount_cents: number;
  status: string;
  square_payment_id: string;
  square_receipt_url?: string;
}

interface RefundRequest {
  id: number;
  booking_id: number;
  reason: string;
  description?: string;
  amount_requested: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'processed';
  admin_notes?: string;
  processed_at?: string;
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  id: number;
  square_booking_id: string;
  service_name: string;
  service_variation_id?: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_note?: string;
  createdAt: string;
  booking_data?: any; // Contains Square booking details and other metadata
  team_member?: {
    id: number;
    name: string;
    square_up_id: string;
  };
  payments?: Payment[];
}

interface BookingListResponse {
  bookings: Booking[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export default function MyBookingsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Refund requests state
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  
  // Refund request states
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundDescription, setRefundDescription] = useState<string>("");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [loadingRefundAmount, setLoadingRefundAmount] = useState(false);

  // View Details modal states
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);


  // Hydration safety
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch bookings
  const fetchBookings = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching bookings for page:", page);
      const response = await BookingService.getUserBookings(page, 10);
      
      console.log("API Response:", response);
      
      // The API client extracts response.data, so response is the actual API response
      // Expected structure: { data: { bookings: [], pagination: {} }, status_code: 200, message: "" }
      if (response.status_code === 200 && response.data) {
        const bookingData: BookingListResponse = response.data;
        console.log("Booking data:", bookingData);
        setBookings(bookingData.bookings || []);
        setCurrentPage(bookingData.pagination?.currentPage || page);
        setTotalPages(bookingData.pagination?.totalPages || 1);
      } else {
        console.error("API returned error:", response);
        setError(response.message || "Failed to fetch bookings");
      }
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      setError(error.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's refund requests
  const fetchRefundRequests = async () => {
    try {
      const response = await BookingService.getUserRefundRequests(1, 100); // Get all refund requests
      
      if (response.status_code === 200 && response.data) {
        setRefundRequests(response.data.refund_requests || []);
      } else {
        console.error("Failed to fetch refund requests:", response);
      }
    } catch (error: any) {
      console.error("Error fetching refund requests:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings(currentPage);
      fetchRefundRequests();
    }
  }, [isAuthenticated, currentPage]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "text-blue-600";
      case "completed":
        return "text-green-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDateTime = (dateTime: string) => {
    return dayjs(dateTime).tz("Australia/Melbourne").format("dddd, MMM D, YYYY [at] h:mm A");
  };

  const formatDate = (dateTime: string) => {
    return dayjs(dateTime).tz("Australia/Melbourne").format("MMM D, YYYY");
  };

  const filteredBookings = statusFilter === "all" 
    ? bookings 
    : bookings.filter(booking => booking.status.toLowerCase() === statusFilter.toLowerCase());

  // Helper function to get refund status for a booking
  const getRefundStatus = (bookingId: number): RefundRequest | null => {
    return refundRequests.find(refund => refund.booking_id === bookingId) || null;
  };

  // Helper function to determine if refund button should be shown
  const shouldShowRefundButton = (booking: Booking): boolean => {
    const refundStatus = getRefundStatus(booking.id);
    
    // Don't show if there's already a refund request
    if (refundStatus) {
      return false;
    }
    
    // Check basic eligibility
    return isRefundEligible(booking);
  };

  // Helper function to get refund status badge
  const getRefundStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, label: 'Refund Pending', color: 'text-orange-600' };
      case 'under_review':
        return { variant: 'secondary' as const, label: 'Under Review', color: 'text-blue-600' };
      case 'approved':
        return { variant: 'secondary' as const, label: 'Approved', color: 'text-green-600' };
      case 'processed':
        return { variant: 'default' as const, label: 'Refunded', color: 'text-green-700' };
      case 'rejected':
        return { variant: 'destructive' as const, label: 'Refund Rejected', color: 'text-red-600' };
      default:
        return { variant: 'outline' as const, label: 'Unknown Status', color: 'text-gray-600' };
    }
  };

  // Refund request handlers
  const handleRefundRequest = async (booking: Booking) => {
    setSelectedBooking(booking);
    setRefundReason("");
    setRefundDescription("");
    setError(null);
    setRefundAmount(""); // Clear amount while loading
    setLoadingRefundAmount(true);
    
    // Get accurate refundable amount from backend
    try {
      const response = await BookingService.checkRefundEligibility(booking.id);
      
      if (response.status_code === 200 && response.data?.eligible && response.data?.payment_info) {
        const paymentInfo = response.data.payment_info;
        
        // Use the actual remaining refundable amount
        const refundableAmount = paymentInfo.remaining_refundable_dollars || "25.00";
        setRefundAmount(refundableAmount);
        
        // If there's a sync issue, show a warning
        if (paymentInfo.sync_error) {
          setError(`Warning: Could not sync with Square. Using local data. ${paymentInfo.sync_error}`);
        } else if (paymentInfo.sync_performed) {
          console.log("Payment synced with Square - using accurate refundable amount");
        }
      } else {
        // Fallback to payment amount from booking data
        let defaultAmount = "25.00";
        if (booking.payments && booking.payments.length > 0) {
          const completedPayment = booking.payments.find(p => p.status === "COMPLETED") || booking.payments[0];
          if (completedPayment) {
            defaultAmount = (completedPayment.amount_cents / 100).toFixed(2);
          }
        }
        setRefundAmount(defaultAmount);
      }
    } catch (error) {
      console.error("Error checking refund eligibility:", error);
      
      // Fallback to payment amount from booking data
      let defaultAmount = "25.00";
      if (booking.payments && booking.payments.length > 0) {
        const completedPayment = booking.payments.find(p => p.status === "COMPLETED") || booking.payments[0];
        if (completedPayment) {
          defaultAmount = (completedPayment.amount_cents / 100).toFixed(2);
        }
      }
      setRefundAmount(defaultAmount);
      setError("Could not verify refundable amount. Please check the amount before submitting.");
    } finally {
      setLoadingRefundAmount(false);
    }
    
    setShowRefundDialog(true);
  };

  // Note: Amount validation now happens on the backend since field is read-only
  const handleSubmitRefund = async () => {
    setError(null);

    // Validate required fields
    if (!selectedBooking || !refundReason || !refundAmount) {
      setError("Please fill in all required fields");
      return;
    }

    // Basic amount validation (detailed validation happens on backend)
    const numAmount = parseFloat(refundAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("No refundable amount available");
      return;
    }

    // Show loading toast at the function level
    const loadingToast = toast.loading('Submitting refund request...', {
      position: 'top-center',
    });

    try {
      setSubmittingRefund(true);

      const requestData = {
        booking_id: selectedBooking.id,
        reason: refundReason,
        description: refundDescription || undefined,
        amount_requested: parseFloat(refundAmount)
      };

      const response = await BookingService.createRefundRequest(requestData);

      if (response.status_code === 200) {
        // Check if the response contains error information
        if (response.data?.error || response.data?.success === false) {
          // Handle backend validation errors
          const errorMessage = response.data.details || response.data.message || response.message || "Failed to submit refund request";
          setError(errorMessage);
          toast.dismiss(loadingToast);
          toast.error(errorMessage, {
            duration: 5000,
            position: 'top-center',
          });
          return;
        }

        // Success case
        setShowRefundDialog(false);
        setSelectedBooking(null);
        setRefundReason("");
        setRefundDescription("");
        setRefundAmount("");
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success("Refund request submitted successfully! We'll review your request and contact you within 2-3 business days.", {
          duration: 6000,
          position: 'top-center',
        });
        
        // Refresh both bookings and refund requests to show status changes
        fetchBookings(currentPage);
        fetchRefundRequests();
      } else {
        const errorMsg = response.message || "Failed to submit refund request";
        setError(errorMsg);
        toast.dismiss(loadingToast);
        toast.error(errorMsg, {
          duration: 5000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error("Error submitting refund request:", error);
      
      // Parse error response if it's from the API
      let errorMsg = error.message || "Failed to submit refund request";
      if (error.response?.data?.data?.details) {
        errorMsg = error.response.data.data.details;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      setError(errorMsg);
      toast.dismiss(loadingToast);
      toast.error(errorMsg, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const isRefundEligible = (booking: Booking) => {
    // Check if booking is confirmed or completed
    if (!['confirmed', 'completed'].includes(booking.status.toLowerCase())) {
      return false;
    }

    // Check if booking is at least 24 hours away
    const bookingDate = new Date(booking.start_at);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntilBooking >= 24;
  };

  const refundReasons = [
    { value: 'change_of_plans', label: 'Change of Plans' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'barber_unavailable', label: 'Barber Unavailable' },
    { value: 'service_issue', label: 'Service Issue' },
    { value: 'double_charge', label: 'Double Charge/Billing Error' },
    { value: 'other', label: 'Other' }
  ];

  // View Details handler
  const handleViewDetails = (booking: Booking) => {
    setSelectedBookingForDetails(booking);
    setShowDetailsDialog(true);
  };




  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          // Default options for specific types
          success: {
            duration: 6000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
      
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-gray-600">
            View and manage your appointment history
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading your bookings...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 font-medium">Error loading bookings</p>
            <p className="text-red-600 text-sm">{error}</p>
            <Button 
              onClick={() => fetchBookings(currentPage)}
              className="mt-3"
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          <>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l6-6m-6 0l6 6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500 mb-4">
                  {statusFilter === "all" 
                    ? "You haven't made any bookings yet." 
                    : `No ${statusFilter} bookings found.`}
                </p>
                <Button 
                  onClick={() => router.push("/book/services")}
                  className="bg-black hover:bg-gray-800"
                >
                  Book Your First Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.service_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Booking ID: {booking.square_booking_id}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusBadgeVariant(booking.status)}>
                            {booking.status.toUpperCase()}
                          </Badge>
                          {(() => {
                            const refundRequest = getRefundStatus(booking.id);
                            if (refundRequest) {
                              const badgeInfo = getRefundStatusBadge(refundRequest.status);
                              return (
                                <Badge variant={badgeInfo.variant} className="text-xs">
                                  {badgeInfo.label}
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-700 w-20">Date:</span>
                              <span className="text-gray-900">{formatDateTime(booking.start_at)}</span>
                            </div>
                            {booking.team_member && (
                              <div className="flex items-center text-sm">
                                <span className="font-medium text-gray-700 w-20">Barber:</span>
                                <span className="text-gray-900">{booking.team_member.name}</span>
                              </div>
                            )}
                            <div className="flex items-center text-sm">
                              <span className="font-medium text-gray-700 w-20">Status:</span>
                              <span className={getStatusColor(booking.status)}>
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <span className="font-medium text-gray-700 w-24">Booked on:</span>
                            <span className="text-gray-900">{formatDate(booking.createdAt)}</span>
                          </div>
                          {booking.customer_note && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Note:</span>
                              <p className="text-gray-900 mt-1">{booking.customer_note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Refund Request Details */}
                      {(() => {
                        const refundRequest = getRefundStatus(booking.id);
                        if (refundRequest) {
                          const badgeInfo = getRefundStatusBadge(refundRequest.status);
                          return (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900 text-sm">Refund Request</h4>
                                  <Badge variant={badgeInfo.variant} className="text-xs">
                                    {badgeInfo.label}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Amount:</span>
                                    <span className="ml-2 text-gray-900">${refundRequest.amount_requested.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Reason:</span>
                                    <span className="ml-2 text-gray-900 capitalize">
                                      {refundRequest.reason.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Submitted:</span>
                                    <span className="ml-2 text-gray-900">{formatDate(refundRequest.createdAt)}</span>
                                  </div>
                                  {refundRequest.processed_at && (
                                    <div>
                                      <span className="font-medium text-gray-700">Processed:</span>
                                      <span className="ml-2 text-gray-900">{formatDate(refundRequest.processed_at)}</span>
                                    </div>
                                  )}
                                </div>
                                {refundRequest.admin_notes && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium text-gray-700">Notes:</span>
                                    <p className="text-gray-900 mt-1">{refundRequest.admin_notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Duration: {dayjs(booking.end_at).diff(dayjs(booking.start_at), 'minute')} minutes
                        </span>
                        <div className="space-x-2">
                          {shouldShowRefundButton(booking) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRefundRequest(booking)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Request Refund
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-4">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Refund Request Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedBooking && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{selectedBooking.service_name}</h4>
                <p className="text-sm text-gray-600">
                  {formatDateTime(selectedBooking.start_at)}
                </p>
                <p className="text-sm text-gray-600">
                  Booking ID: {selectedBooking.square_booking_id}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason for Refund *</Label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {refundReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-amount">
                Refund Amount *
                {loadingRefundAmount && (
                  <span className="ml-2 text-xs text-blue-600">(Loading available amount...)</span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="refund-amount"
                  type="text"
                  value={refundAmount}
                  readOnly
                  disabled={loadingRefundAmount}
                  className={`pl-8 bg-gray-50 cursor-not-allowed ${
                    loadingRefundAmount ? 'bg-gray-100' : ''
                  }`}
                  placeholder={loadingRefundAmount ? "Loading..." : "25.00"}
                />
                {loadingRefundAmount && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {loadingRefundAmount 
                  ? "Checking available refund amount from Square..." 
                  : "Amount automatically calculated based on your payment and Square records"
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-description">Additional Details</Label>
              <Textarea
                id="refund-description"
                value={refundDescription}
                onChange={(e) => setRefundDescription(e.target.value)}
                placeholder="Please provide any additional details about your refund request..."
                rows={3}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRefundDialog(false)}
                disabled={submittingRefund}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRefund}
                disabled={submittingRefund || !refundReason || !refundAmount || loadingRefundAmount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submittingRefund ? "Submitting..." : "Submit Refund Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBookingForDetails && (
            <div className="space-y-6 py-4">
              {/* Booking Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {selectedBookingForDetails.service_name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Booking ID:</span>
                    <span className="ml-2 text-gray-900">{selectedBookingForDetails.square_booking_id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <Badge variant={getStatusBadgeVariant(selectedBookingForDetails.status)} className="ml-2">
                      {selectedBookingForDetails.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Appointment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Date & Time:</span>
                    <p className="text-gray-900 mt-1">{formatDateTime(selectedBookingForDetails.start_at)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <p className="text-gray-900 mt-1">
                      {dayjs(selectedBookingForDetails.end_at).diff(dayjs(selectedBookingForDetails.start_at), 'minute')} minutes
                    </p>
                  </div>
                  {selectedBookingForDetails.team_member && (
                    <div>
                      <span className="font-medium text-gray-700">Barber:</span>
                      <p className="text-gray-900 mt-1">{selectedBookingForDetails.team_member.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Booked on:</span>
                    <p className="text-gray-900 mt-1">{formatDate(selectedBookingForDetails.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {selectedBookingForDetails.payments && selectedBookingForDetails.payments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-3">
                    {selectedBookingForDetails.payments.map((payment) => (
                      <div key={payment.id} className="bg-blue-50 p-3 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Amount:</span>
                            <span className="ml-2 text-gray-900">${(payment.amount_cents / 100).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Status:</span>
                            <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'} className="ml-2">
                              {payment.status}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Payment ID:</span>
                            <span className="ml-2 text-gray-900 font-mono text-xs">{payment.square_payment_id}</span>
                          </div>
                          {payment.square_receipt_url && (
                            <div>
                              <span className="font-medium text-gray-700">Receipt:</span>
                              <a 
                                href={payment.square_receipt_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                              >
                                View Receipt
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Notes */}
              {selectedBookingForDetails.customer_note && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-900 text-sm">{selectedBookingForDetails.customer_note}</p>
                  </div>
                </div>
              )}

              {/* Refund Information */}
              {(() => {
                const refundRequest = getRefundStatus(selectedBookingForDetails.id);
                if (refundRequest) {
                  const badgeInfo = getRefundStatusBadge(refundRequest.status);
                  return (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Refund Information</h4>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-700">Status:</span>
                          <Badge variant={badgeInfo.variant} className="text-xs">
                            {badgeInfo.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Amount:</span>
                            <span className="ml-2 text-gray-900">${refundRequest.amount_requested.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Reason:</span>
                            <span className="ml-2 text-gray-900 capitalize">
                              {refundRequest.reason.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Submitted:</span>
                            <span className="ml-2 text-gray-900">{formatDate(refundRequest.createdAt)}</span>
                          </div>
                          {refundRequest.processed_at && (
                            <div>
                              <span className="font-medium text-gray-700">Processed:</span>
                              <span className="ml-2 text-gray-900">{formatDate(refundRequest.processed_at)}</span>
                            </div>
                          )}
                        </div>
                        {refundRequest.admin_notes && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">Admin Notes:</span>
                            <p className="text-gray-900 mt-1">{refundRequest.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                {shouldShowRefundButton(selectedBookingForDetails) && (
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleRefundRequest(selectedBookingForDetails);
                    }}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Request Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
    </>
  );
}