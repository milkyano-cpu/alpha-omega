// lib/booking-service.ts
import { API } from './api-client';

// Define interfaces for booking-related data
export interface BookingRequest {
  service_variation_id: string;
  team_member_id: string;
  start_at: string;
  service_variation_version?: number;
  customer_note?: string;
  // Optional idempotency key for Square API
  idempotencyKey?: string;
}

export interface UpdateBookingRequest {
  start_at: string;
  version: number;
}

export interface SquareBookingRequest {
  serviceVariationId: string;
  teamMemberId: string;
  customerId?: string;
  startAt: string;
  serviceVariationVersion?: number;
  customerNote?: string;
  idempotencyKey: string;
  locationId: string;
}

export interface TeamMember {
  id: number;
  square_up_id: string;
  first_name: string;
  last_name: string;
  status: string;
  email_address?: string;
  is_owner?: boolean;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price_amount: number;
  price_currency: string;
  duration: number;
  service_variation_id: string;
  square_catalog_id: string;
  variation_name?: string;
  is_available?: boolean;
  // Many-to-many relationship with TeamMembers
  teamMembers?: TeamMember[];
}

export interface TimeSlot {
  start_at: string;
  location_id: string;
  formatted_time?: string;
  appointment_segments: {
    duration_minutes: number;
    service_variation_id: string;
    team_member_id: string;
    service_variation_version: number;
  }[];
}

export interface AvailabilityResponse {
  availabilities_by_date: Record<string, TimeSlot[]>;
  errors: any[];
}

export interface BookingResponse {
  data: {
    id: number;
    square_booking_id: string;
    service_name: string;
    start_at: string;
    end_at: string;
    status: string;
  };
  status_code: number;
  message: string;
}

export interface BatchBookingRequest {
  bookings: BookingRequest[];
  idempotencyKey: string;
  payment_info?: {
    paymentId: string;
    amount: string;
    currency: string;
    receiptUrl?: string;
  };
}

export interface BatchBookingResponse {
  success: boolean;
  created_bookings: Array<{
    index: number;
    booking: BookingResponse;
    success: boolean;
  }>;
  errors: Array<{
    index: number;
    error: string;
    bookingData: BookingRequest;
  }>;
  total_requested: number;
  total_created: number;
  total_failed: number;
}

export interface AppointmentSegment {
  service_variation_id: string;
  team_member_id: string;
  duration_minutes: number;
  service_variation_version?: number;
  start_at: string; // Individual segment start time
}

export interface SingleBookingRequest {
  start_at: string; // Overall booking start time (earliest segment)
  appointment_segments: AppointmentSegment[];
  customer_note?: string;
  idempotencyKey: string;
  payment_info?: {
    paymentId: string;
    amount: string;
    currency: string;
    receiptUrl: string;
  };
}

export interface SingleBookingResponse {
  success: boolean;
  booking?: BookingResponse;
  error?: string;
}

export interface SquareBookingResponse {
  success: boolean;
  booking?: {
    id: string;
    status: string;
    startAt: string;
    locationId: string;
    customerId?: string;
    createdAt: string;
    version: string;
  };
  message?: string;
  details?: any[];
  isRetry?: boolean;
}

export const BookingService = {
  /**
   * Get all team members (barbers)
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const response = await API.get('/team-members');
      return response.data || [];
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch barbers");
    }
  },

  /**
   * Get services for a specific team member
   */
  async getTeamMemberServices(teamMemberId: number): Promise<Service[]> {
    try {
      const response = await API.get(`/services/team-member/${teamMemberId}`);
      return response.data || [];
    } catch (error: any) {
      throw new Error(error.message || `Failed to fetch services for barber ${teamMemberId}`);
    }
  },

  /**
   * Get all services (for reversed flow)
   */
  async getAllServices(): Promise<Service[]> {
    try {
      const response = await API.get('/services');
      return response.data || [];
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch services");
    }
  },

  /**
   * Get barbers who offer a specific service (for reversed flow)
   */
  async getBarbersForService(serviceId: number): Promise<TeamMember[]> {
    try {
      const response = await API.get(`/services/${serviceId}/barbers`);
      return response.data || [];
    } catch (error: any) {
      throw new Error(error.message || `Failed to fetch barbers for service ${serviceId}`);
    }
  },

  /**
   * Create booking directly with Square API
   * This is more reliable than going through our backend first
   */
  async createSquareBooking(bookingData: SquareBookingRequest): Promise<SquareBookingResponse> {
    try {
      const response = await fetch('/api/create-square-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create Square booking');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error creating Square booking:', error);
      throw error;
    }
  },

  /**
   * Create a booking in our backend system
   * This method won't throw errors so the user flow isn't disrupted
   */
  async syncBookingWithBackend(
    bookingData: BookingRequest, 
    squareBookingId?: string
  ): Promise<BookingResponse | null> {
    try {
      // Add Square booking ID to request if available
      const requestData = squareBookingId ? 
        { ...bookingData, square_booking_id: squareBookingId } : 
        bookingData;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token") || null}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      // Even if response is not OK, we don't throw an error
      // We just return null or the data we got
      return response.ok ? data : null;
    } catch (error: any) {
      // Log error but don't throw - this ensures user flow continues
      console.error("Error syncing booking with backend:", error);
      return null;
    }
  },

  /**
   * Create a booking - handles both Square and backend creation
   * This method remains the same from the caller's perspective for backward compatibility
   */
  async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    // First try to create the Square booking directly (more reliable)
    const idempotencyKey = bookingData.idempotencyKey || crypto.randomUUID();

    // Create the Square booking
    const squareResponse = await this.createSquareBooking({
      serviceVariationId: bookingData.service_variation_id,
      teamMemberId: bookingData.team_member_id,
      startAt: bookingData.start_at,
      serviceVariationVersion: bookingData.service_variation_version,
      customerNote: bookingData.customer_note,
      idempotencyKey: idempotencyKey,
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '',
      // Include customer ID if available in localStorage
      customerId: localStorage.getItem('square_customer_id') || undefined,
    });

    // Now, regardless of backend result, sync with our backend
    // Use the same idempotency key to avoid duplicates
    const backendResponse = await this.syncBookingWithBackend(
      { 
        ...bookingData,
        idempotencyKey 
      },
      squareResponse.booking?.id
    );

    // If backend sync failed but Square booking succeeded, create a synthetic response
    // This ensures the user flow continues smoothly
    if (!backendResponse && squareResponse.booking) {
      // Create a minimal response with the essential Square booking data
      return {
        data: {
          id: 0, // Use 0 to indicate it's not synced with backend yet
          square_booking_id: squareResponse.booking.id,
          service_name: 'Your appointment', // Generic name
          start_at: squareResponse.booking.startAt,
          end_at: new Date(new Date(squareResponse.booking.startAt).getTime() + 3600000).toISOString(), // Add 1 hour for end time
          status: squareResponse.booking.status || 'ACCEPTED',
        },
        status_code: 200,
        message: 'Booking created in Square but not yet synced with backend',
      };
    }

    // If we got here with a backendResponse, return it
    // Otherwise, something really went wrong (both Square and backend failed)
    if (backendResponse) {
      return backendResponse;
    }

    // Both systems failed - extremely unlikely with our retry logic
    throw new Error("Failed to create booking in both Square and backend systems");
  },

  /**
   * Search for available time slots for a service
   */
  async searchAvailability(
    serviceVariationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityResponse> {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (!token) {
      throw new Error("Authentication required. Please log in again.");
    }

    console.log("Making availability request:", {
      serviceVariationId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      hasToken: !!token
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/services/availability/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        service_variation_id: serviceVariationId,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch availability";
      try {
        const errorData = await response.json();
        console.error("Availability API error details:", errorData);
        
        // Handle different error response formats
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          // If error is an object, stringify it properly
          if (typeof errorData.error === 'object') {
            errorMessage = JSON.stringify(errorData.error);
          } else {
            errorMessage = errorData.error;
          }
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((err: any) => err.message || err).join(', ');
        }
      } catch {
        console.error("Failed to parse error response");
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<any> {
    try {
      const response = await API.post(`/bookings/${bookingId}/cancel`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to cancel booking");
    }
  },

  /**
   * Update/reschedule an existing booking
   */
  async updateBooking(bookingId: string, updateData: UpdateBookingRequest): Promise<any> {
    try {
      const response = await API.put(`/bookings/${bookingId}`, updateData);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to update booking");
    }
  },


  /**
   * Get user's bookings
   */
  async getUserBookings(page = 1, limit = 10): Promise<any> {
    try {
      const response = await API.get(`/bookings?page=${page}&limit=${limit}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch bookings");
    }
  },

  /**
   * Create multiple separate bookings (for additional services with same barber)
   */
  async createBatchBookings(batchRequest: BatchBookingRequest): Promise<BatchBookingResponse> {
    try {
      const response = await API.post('/bookings/batch', batchRequest);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create batch bookings");
    }
  },

  /**
   * Create single booking with multiple appointment segments (Square API compliant)
   */
  async createBookingWithSegments(bookingRequest: SingleBookingRequest): Promise<SingleBookingResponse> {
    try {
      console.log('🔄 BookingService making API call to /bookings/segments');
      const response = await API.post('/bookings/segments', bookingRequest);
      console.log('📨 Raw API response:', JSON.stringify(response, null, 2));
      
      // API.post already returns response.data, so response is the actual data
      return response;
    } catch (error: any) {
      console.error('❌ BookingService API call failed:', error);
      throw new Error(error.message || "Failed to create booking with segments");
    }
  },

  // Refund Request Methods
  
  /**
   * Get user's refund requests
   */
  async getUserRefundRequests(page = 1, limit = 10): Promise<any> {
    try {
      const response = await API.get(`/refund-requests?page=${page}&limit=${limit}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch refund requests");
    }
  },

  /**
   * Create a new refund request
   */
  async createRefundRequest(requestData: {
    booking_id: number;
    reason: string;
    description?: string;
    amount_requested: number;
  }): Promise<any> {
    try {
      const response = await API.post('/refund-requests', requestData);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create refund request");
    }
  },

  /**
   * Check if a booking is eligible for refund
   */
  async checkRefundEligibility(bookingId: number): Promise<any> {
    try {
      const response = await API.get(`/refund-requests/eligibility/${bookingId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to check refund eligibility");
    }
  },

  /**
   * Cancel/withdraw a pending refund request
   */
  async cancelRefundRequest(refundRequestId: number): Promise<any> {
    try {
      const response = await API.delete(`/refund-requests/${refundRequestId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to cancel refund request");
    }
  },

  /**
   * Get refund request by ID
   */
  async getRefundRequestById(refundRequestId: number): Promise<any> {
    try {
      const response = await API.get(`/refund-requests/${refundRequestId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch refund request");
    }
  },
};