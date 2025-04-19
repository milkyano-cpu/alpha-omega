// lib/booking-service.ts

// Define interfaces for booking-related data
export interface BookingRequest {
  service_variation_id: string;
  team_member_id: string;
  start_at: string;
  service_variation_version?: number;
  customer_note?: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Helper to get auth token
const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const BookingService = {
  /**
   * Get all team members (barbers)
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    const response = await fetch(`${API_URL}/team-members`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch barbers");
    }

    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get services for a specific team member
   */
  async getTeamMemberServices(teamMemberId: number): Promise<Service[]> {
    const response = await fetch(
      `${API_URL}/services/team-member/${teamMemberId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch services for barber ${teamMemberId}`);
    }

    const data = await response.json();
    return data.data || [];
  },

  /**
   * Create a new booking
   */
  async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const response = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create booking");
    }

    return await response.json();
  },

  /**
   * Search for available time slots for a service
   */
  async searchAvailability(
    serviceVariationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityResponse> {
    const response = await fetch(`${API_URL}/services/availability/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
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
    const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to cancel booking");
    }

    return await response.json();
  },

  /**
   * Get user's bookings
   */
  async getUserBookings(page = 1, limit = 10): Promise<any> {
    const response = await fetch(
      `${API_URL}/bookings?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch bookings");
    }

    return await response.json();
  },
};
