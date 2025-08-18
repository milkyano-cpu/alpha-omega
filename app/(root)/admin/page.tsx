"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { API } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

interface Payment {
  id: number;
  amount_cents: number;
  currency: string;
  status: string;
  square_payment_id: string;
  square_receipt_url?: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
}

interface TeamMember {
  id: number;
  name: string;
  square_up_id: string;
}

interface Booking {
  id: number;
  service_name: string;
  start_at: string;
  end_at: string;
  status: string;
  notes?: string;
  square_booking_id: string;
  user?: User;
  team_member?: TeamMember;
  payments?: Payment[];
  createdAt: string;
}

interface BookingResponse {
  data: {
    bookings: Booking[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message: string;
  statusCode: number;
}

interface RefundRequest {
  id: number;
  booking_id: number;
  user_id: number;
  reason: string;
  reason_display: string;
  description?: string;
  amount_requested: number;
  status: string;
  status_display: string;
  admin_notes?: string;
  processed_at?: string;
  square_refund_id?: string;
  created_at: string;
  updated_at: string;
  booking?: {
    id: number;
    square_booking_id: string;
    service_name: string;
    start_at: string;
    end_at: string;
    status: string;
    team_member?: TeamMember;
  };
  user?: User;
  payment?: {
    id: number;
    original_amount_cents: number;
    original_amount_dollars: string;
    total_refunded_cents: number;
    total_refunded_dollars: string;
    remaining_refundable_cents: number;
    remaining_refundable_dollars: string;
    can_be_refunded: boolean;
    is_fully_refunded: boolean;
    square_payment_id: string;
    status: string;
  };
}

interface RefundRequestResponse {
  data: {
    refund_requests: RefundRequest[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message: string;
  status_code: number;
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Refund Request State
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundPagination, setRefundPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [refundStatusFilter, setRefundStatusFilter] = useState<string>("all");

  // Refund Actions
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    refundId: number;
    amount: number;
    notes: string;
  } | null>(null);

  const fetchBookings = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await API.get<BookingResponse>(
        `/bookings?page=${page}&limit=20`
      );

      if (response.data && response.data.bookings) {
        setBookings(response.data.bookings);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRefundRequests = async (page: number = 1) => {
    try {
      setRefundLoading(true);
      const statusQuery = refundStatusFilter !== "all" ? `&status=${refundStatusFilter}` : "";
      const response = await API.get<RefundRequestResponse>(
        `/refund-requests?page=${page}&limit=20${statusQuery}`
      );

      if (response.data && response.data.refund_requests) {
        setRefundRequests(response.data.refund_requests);
        setRefundPagination(response.data.pagination);
      }
    } catch (err: any) {
      console.error("Error fetching refund requests:", err);
      setRefundError(err.message || "Failed to fetch refund requests");
    } finally {
      setRefundLoading(false);
    }
  };

  const handleRefundStatusUpdate = async (refundId: number, newStatus: string, notes?: string) => {
    const loadingToast = toast.loading(`Updating refund status to ${newStatus}...`, {
      position: 'top-center',
    });
    
    try {
      setActionLoading(true);
      const response = await API.patch(`/refund-requests/${refundId}/status`, {
        status: newStatus,
        admin_notes: notes || ""
      });

      if (response.status_code === 200) {
        // Refresh the refund requests list
        await fetchRefundRequests(refundPagination.currentPage);
        setShowRefundDialog(false);
        setSelectedRefund(null);
        setAdminNotes("");
        
        toast.dismiss(loadingToast);
        toast.success(`Refund status updated to ${newStatus} successfully!`, {
          duration: 4000,
          position: 'top-center',
        });
      } else {
        const errorMsg = response.message || "Failed to update refund status";
        setRefundError(errorMsg);
        toast.dismiss(loadingToast);
        toast.error(errorMsg, {
          duration: 5000,
          position: 'top-center',
        });
      }
    } catch (err: any) {
      console.error("Error updating refund status:", err);
      const errorMsg = err.message || "Failed to update refund status";
      setRefundError(errorMsg);
      toast.dismiss(loadingToast);
      toast.error(errorMsg, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRefund = async (refundId: number) => {
    const loadingToast = toast.loading('Processing refund through Square...', {
      position: 'top-center',
    });
    
    try {
      setActionLoading(true);
      const response = await API.post(`/refund-requests/${refundId}/process`, {});

      if (response.status_code === 200) {
        // Refresh the refund requests list
        await fetchRefundRequests(refundPagination.currentPage);
        setShowRefundDialog(false);
        setSelectedRefund(null);
        setAdminNotes("");
        
        toast.dismiss(loadingToast);
        toast.success('Refund processed successfully! Money has been returned to customer.', {
          duration: 6000,
          position: 'top-center',
        });
      } else {
        const errorMsg = response.message || "Failed to process refund";
        setRefundError(errorMsg);
        toast.dismiss(loadingToast);
        toast.error(errorMsg, {
          duration: 5000,
          position: 'top-center',
        });
      }
    } catch (err: any) {
      console.error("Error processing refund:", err);
      const errorMsg = err.message || "Failed to process refund";
      setRefundError(errorMsg);
      toast.dismiss(loadingToast);
      toast.error(errorMsg, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRefundProcess = (refund: RefundRequest, notes: string) => {
    setConfirmAction({
      type: 'process',
      refundId: refund.id,
      amount: refund.amount_requested,
      notes: notes
    });
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    
    setShowConfirmModal(false);
    
    if (confirmAction.type === 'process') {
      // Process refund through Square (new endpoint)
      await handleProcessRefund(confirmAction.refundId);
    } else {
      // Regular status updates
      await handleRefundStatusUpdate(confirmAction.refundId, "processed", confirmAction.notes);
    }
    
    setConfirmAction(null);
  };

  const handleRefresh = async () => {
    const loadingToast = toast.loading('Refreshing data...', {
      position: 'top-center',
    });
    
    try {
      setError(null);
      setRefundError(null);
      await Promise.all([
        fetchBookings(pagination.currentPage),
        fetchRefundRequests(refundPagination.currentPage)
      ]);
      
      toast.dismiss(loadingToast);
      toast.success('Data refreshed successfully!', {
        duration: 2000,
        position: 'top-center',
      });
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Failed to refresh data', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === "admin") {
      fetchBookings();
      fetchRefundRequests();
    }
  }, [mounted, isAuthenticated, user]);

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === "admin") {
      fetchRefundRequests(refundPagination.currentPage);
    }
  }, [refundStatusFilter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "processed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== "all" && booking.status.toLowerCase() !== statusFilter) {
      return false;
    }

    // Payment status filter
    if (paymentStatusFilter !== "all") {
      const hasPaymentWithStatus = (booking.payments || []).some(
        (payment) => payment.status.toLowerCase() === paymentStatusFilter
      );
      if (!hasPaymentWithStatus) {
        return false;
      }
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (booking.user?.name || '').toLowerCase().includes(searchLower) ||
        (booking.user?.email || '').toLowerCase().includes(searchLower) ||
        booking.service_name.toLowerCase().includes(searchLower) ||
        booking.square_booking_id.toLowerCase().includes(searchLower) ||
        booking.id.toString().includes(searchLower);
      
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  const calculateTotalRevenue = () => {
    return filteredBookings.reduce((total, booking) => {
      const bookingRevenue = (booking.payments || [])
        .filter(payment => payment.status.toLowerCase() === "completed")
        .reduce((sum, payment) => sum + payment.amount_cents, 0);
      return total + bookingRevenue;
    }, 0) / 100; // Convert cents to dollars
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Please Log In
              </h2>
              <p className="text-gray-600 mb-6">
                You need to be logged in to access the admin dashboard.
              </p>
              <Link href="/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">
                You don&apos;t have permission to access the admin dashboard.
              </p>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
            </div>
          </div>
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
            duration: 4000,
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
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
        }}
      />
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage bookings, payments, and refund requests
          </p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings">Bookings & Payments</TabsTrigger>
            <TabsTrigger value="refunds">Refund Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
            <p className="text-2xl font-bold text-gray-900">{filteredBookings.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">
              ${calculateTotalRevenue().toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Confirmed Bookings</h3>
            <p className="text-2xl font-bold text-blue-600">
              {filteredBookings.filter(b => b.status.toLowerCase() === "confirmed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Completed Bookings</h3>
            <p className="text-2xl font-bold text-green-600">
              {filteredBookings.filter(b => b.status.toLowerCase() === "completed").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Name, email, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentStatusFilter("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No bookings found matching your filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Barber</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {booking.user ? booking.user.name : 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.user?.email || 'No email'}
                        </div>
                        {booking.user?.phone_number && (
                          <div className="text-sm text-gray-500">{booking.user.phone_number}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{booking.service_name}</div>
                        <div className="text-sm text-gray-500">ID: {booking.id}</div>
                        <div className="text-sm text-gray-500">
                          Square: {booking.square_booking_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {booking.team_member ? booking.team_member.name : 'No barber assigned'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {format(new Date(booking.start_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(booking.start_at), "h:mm a")} - {format(new Date(booking.end_at), "h:mm a")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(booking.payments || []).length > 0 ? (
                        <div className="space-y-1">
                          {(booking.payments || []).map((payment) => (
                            <Badge
                              key={payment.id}
                              className={getPaymentStatusColor(payment.status)}
                            >
                              {payment.status}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">No Payment</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(booking.payments || []).length > 0 ? (
                        <div className="space-y-1">
                          {(booking.payments || []).map((payment) => (
                            <div key={payment.id} className="text-sm">
                              ${(payment.amount_cents / 100).toFixed(2)} {payment.currency}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {(booking.payments || []).length > 0 && booking.payments?.[0]?.square_receipt_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={booking.payments?.[0]?.square_receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Receipt
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 py-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => fetchBookings(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchBookings(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
          </TabsContent>

          <TabsContent value="refunds" className="space-y-6">
            {/* Refund Requests Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
                <p className="text-2xl font-bold text-gray-900">{refundRequests.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {refundRequests.filter(r => r.status === "pending").length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Approved</h3>
                <p className="text-2xl font-bold text-green-600">
                  {refundRequests.filter(r => r.status === "approved").length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Amount Requested</h3>
                <p className="text-2xl font-bold text-blue-600">
                  ${refundRequests.reduce((sum, r) => sum + r.amount_requested, 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Refund Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refundLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${refundLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select value={refundStatusFilter} onValueChange={setRefundStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => setRefundStatusFilter("all")}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {refundError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{refundError}</p>
              </div>
            )}

            {refundLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : refundRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No refund requests found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Booking</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundRequests.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {refund.user ? refund.user.name : 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {refund.user?.email || 'No email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {refund.booking?.service_name || 'Unknown Service'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {refund.booking_id}
                            </div>
                            {refund.booking?.start_at && (
                              <div className="text-sm text-gray-500">
                                {format(new Date(refund.booking.start_at), "MMM d, yyyy h:mm a")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {refund.reason_display}
                            </div>
                            {refund.description && (
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {refund.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            ${refund.amount_requested.toFixed(2)}
                          </div>
                          {refund.payment && (
                            <div className="text-xs text-gray-500 mt-1">
                              Available: ${refund.payment.remaining_refundable_dollars}
                              {refund.payment.total_refunded_cents > 0 && (
                                <span className="text-orange-600 ml-1">
                                  (${refund.payment.total_refunded_dollars} already refunded)
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRefundStatusColor(refund.status)}>
                            {refund.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {format(new Date(refund.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedRefund(refund);
                                setAdminNotes(refund.admin_notes || "");
                                setShowRefundDialog(true);
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Refund Pagination */}
                {refundPagination.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 py-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => fetchRefundRequests(refundPagination.currentPage - 1)}
                      disabled={refundPagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {refundPagination.currentPage} of {refundPagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => fetchRefundRequests(refundPagination.currentPage + 1)}
                      disabled={refundPagination.currentPage === refundPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Refund Review Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Review Refund Request</DialogTitle>
            </DialogHeader>
            {selectedRefund && (
              <div className="space-y-6 py-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Customer:</span> {selectedRefund.user?.name}
                    </div>
                    <div>
                      <span className="font-medium">Requested Amount:</span> ${selectedRefund.amount_requested.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Reason:</span> {selectedRefund.reason_display}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {selectedRefund.status_display}
                    </div>
                  </div>
                  
                  {selectedRefund.payment && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Payment Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-blue-700">Original Payment:</span> ${selectedRefund.payment.original_amount_dollars}
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Already Refunded:</span> ${selectedRefund.payment.total_refunded_dollars}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-blue-700">Available to Refund:</span> <span className="text-lg font-bold text-blue-900">${selectedRefund.payment.remaining_refundable_dollars}</span>
                        </div>
                      </div>
                      {parseFloat(selectedRefund.payment.remaining_refundable_dollars) < selectedRefund.amount_requested && (
                        <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800 text-sm">
                          <strong>Warning:</strong> Requested amount (${selectedRefund.amount_requested.toFixed(2)}) exceeds available refund (${selectedRefund.payment.remaining_refundable_dollars}). Only ${selectedRefund.payment.remaining_refundable_dollars} will be refunded.
                        </div>
                      )}
                    </div>
                  )}
                  {selectedRefund.description && (
                    <div className="mt-3">
                      <span className="font-medium">Description:</span>
                      <p className="text-gray-600 mt-1">{selectedRefund.description}</p>
                    </div>
                  )}
                </div>

                {selectedRefund.booking && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Booking Information</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Service:</span> {selectedRefund.booking.service_name}</div>
                      <div><span className="font-medium">Date:</span> {format(new Date(selectedRefund.booking.start_at), "MMMM d, yyyy 'at' h:mm a")}</div>
                      <div><span className="font-medium">Barber:</span> {selectedRefund.booking.team_member?.name || 'Not assigned'}</div>
                      <div><span className="font-medium">Status:</span> {selectedRefund.booking.status}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Notes
                  </label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this refund request..."
                    rows={3}
                  />
                  {selectedRefund.status === "approved" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Ready to Process Refund
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Clicking &quot;Process Square Refund&quot; will immediately charge the refund to Square
                              and send the money back to the customer. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowRefundDialog(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  {selectedRefund.status === "pending" && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleRefundStatusUpdate(selectedRefund.id, "rejected", adminNotes)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Processing..." : "Reject"}
                      </Button>
                      <Button
                        onClick={() => handleRefundStatusUpdate(selectedRefund.id, "approved", adminNotes)}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading ? "Processing..." : "Approve"}
                      </Button>
                    </>
                  )}
                  {selectedRefund.status === "approved" && (
                    <Button
                      onClick={() => handleConfirmRefundProcess(selectedRefund, adminNotes)}
                      disabled={actionLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {actionLoading ? "Processing Refund..." : "Process Square Refund"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Modal */}
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">Confirm Square Refund Processing</DialogTitle>
            </DialogHeader>
            {confirmAction && (
              <div className="space-y-4 py-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        ⚠️ Critical Action
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          You are about to process a <strong>${confirmAction.amount.toFixed(2)} refund</strong> through Square.
                        </p>
                        <p className="mt-2">
                          This will immediately:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Charge the refund to your Square account</li>
                          <li>Send money back to the customer&apos;s payment method</li>
                          <li>Update the booking status</li>
                          <li><strong>This action cannot be undone</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Refund Details</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Amount:</strong> ${confirmAction.amount.toFixed(2)}</div>
                    <div><strong>Refund ID:</strong> {confirmAction.refundId}</div>
                    {confirmAction.notes && (
                      <div><strong>Admin Notes:</strong> {confirmAction.notes}</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={executeConfirmedAction}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Process ${confirmAction.amount.toFixed(2)} Refund
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}