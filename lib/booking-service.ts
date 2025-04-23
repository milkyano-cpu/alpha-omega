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
  team_member_id: number;
  name: string;
  description: string;
  price_amount: number;
  price_currency: string;
  duration: number;
  service_variation_id: string;
  square_catalog_id: string;
  variation_name?: string;
  is_available?: boolean;
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
          Authorization: `Bearer ${localStorage.getItem("token") || null}`,
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/services/availability/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || null}`,
      },
      body: JSON.stringify({
        service_variation_id: serviceVariationId,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch availability");
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
};