"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Service,
  TimeSlot,
  BookingService,
  AvailabilityResponse,
  TeamMember,
} from "@/lib/booking-service";
import { StablePaymentForm } from "@/components/pages/appointment/StablePaymentForm";
import {
  DateTimeSelector,
} from "@/components/pages/appointment";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { MarqueeItems } from "@/components/navbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VerificationGuard } from "@/components/verification-guard";

// Additional service interface
interface AdditionalService {
  service: Service;
  barber: TeamMember;
  timeSlot: TimeSlot;
}

dayjs.extend(utc);
dayjs.extend(timezone);

function CleanAppointmentPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Ref for payment section to enable auto-scroll on mobile
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Core states
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [timeAutoSelected, setTimeAutoSelected] = useState(false);
  // const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Availability states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availabilityData, setAvailabilityData] =
    useState<AvailabilityResponse | null>(null);
  const [availableTimes, setAvailableTimes] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [monthCache, setMonthCache] = useState<
    Record<string, AvailabilityResponse>
  >({});
  const [showManualTimeSelection, setShowManualTimeSelection] = useState(false);

  // Additional services states
  const [additionalServices, setAdditionalServices] = useState<
    AdditionalService[]
  >([]);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allBarbers, setAllBarbers] = useState<Record<number, TeamMember[]>>(
    {},
  );
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  // Load selected services from localStorage
  useEffect(() => {
    if (!isAuthenticated) return;

    // Load selected services
    const servicesData = localStorage.getItem("selectedServices");
    if (servicesData) {
      try {
        const services = JSON.parse(servicesData);
        console.log("Loading selected services:", services);
        setSelectedServices(services);
        setSelectedService(services[0] || null);
      } catch (err) {
        console.error("Error parsing selected services:", err);
        router.push("/book/services");
        return;
      }
    } else {
      console.log("No selected services found, redirecting to services");
      router.push("/book/services");
      return;
    }

    // Check for auto-selected time from closest-time barber selection
    const autoSelectedTimeFlag = localStorage.getItem("autoSelectedTime");
    const selectedBarberId = localStorage.getItem("selectedBarberId");
    const rescheduleBookingId = localStorage.getItem("rescheduleBookingId");

    if (autoSelectedTimeFlag === "true") {
      const savedTimeSlot = localStorage.getItem("selectedTimeSlot");
      if (savedTimeSlot) {
        try {
          const parsedTimeSlot = JSON.parse(savedTimeSlot);
          console.log("Loading auto-selected time slot:", parsedTimeSlot);

          setSelectedTime(parsedTimeSlot);
          setTimeAutoSelected(true);
          // setShowPaymentForm(true); // Commented since showPaymentForm is not used

          // Update selectedDate to match the auto-selected time's date
          if (parsedTimeSlot.start_at) {
            const autoSelectedDate = new Date(parsedTimeSlot.start_at);
            setSelectedDate(autoSelectedDate);
            console.log(
              "Updated selectedDate to match auto-selected time:",
              autoSelectedDate.toISOString(),
            );
          }

          // Clean up the auto-selection flags
          localStorage.removeItem("selectedTimeSlot");
          localStorage.removeItem("autoSelectedTime");
        } catch (err) {
          console.error("Error parsing auto-selected time slot:", err);
          localStorage.removeItem("selectedTimeSlot");
          localStorage.removeItem("autoSelectedTime");
        }
      }
    } else if (rescheduleBookingId) {
      // Reschedule scenario - always show manual time selection
      console.log(
        "Reschedule detected, enabling manual time selection",
        {
          rescheduleBookingId,
        },
      );
      setShowManualTimeSelection(true);
    } else if (selectedBarberId && autoSelectedTimeFlag !== "true") {
      // Manual barber selection - show manual time selection immediately
      console.log(
        "Manual barber selection detected, enabling manual time selection",
        {
          selectedBarberId,
          autoSelectedTimeFlag,
        },
      );
      setShowManualTimeSelection(true);
    } else {
      console.log("No manual selection triggered", {
        hasSelectedBarberId: !!selectedBarberId,
        autoSelectedTimeFlag,
        hasRescheduleId: !!rescheduleBookingId,
      });
    }
  }, [isAuthenticated, router]);

  // Handle booking confirmation
  useEffect(() => {
    if (bookingConfirmed) {
      // Clear localStorage
      localStorage.removeItem("selectedServices");
      localStorage.removeItem("selectedService");
      localStorage.removeItem("selectedBarberId");
      localStorage.removeItem("rescheduleBookingId");

      // Clear additional services
      setAdditionalServices([]);

      // Redirect to thank you page
      setTimeout(() => {
        router.push("/book/thank-you");
      }, 400);
    }
  }, [bookingConfirmed, router]);

  // Fetch availability when service changes or when manual selection is requested
  useEffect(() => {
    console.log("🔍 Availability useEffect check:", {
      selectedService: !!selectedService,
      showManualTimeSelection,
      serviceVariationId: selectedService?.service_variation_id,
    });

    if (!selectedService || !showManualTimeSelection) {
      console.log("⏭️ Skipping availability fetch:", {
        noService: !selectedService,
        noManualSelection: !showManualTimeSelection,
      });
      return;
    }

    const fetchAvailabilityData = async () => {
      setIsLoadingAvailability(true);
      setError(null);

      try {
        const selectedMonth = selectedDate.getMonth() + 1;
        const selectedYear = selectedDate.getFullYear();
        const cacheKey = `${selectedYear}-${String(selectedMonth).padStart(
          2,
          "0",
        )}`;

        // Check cache first
        if (monthCache[cacheKey]) {
          console.log(`Using cached availability data for ${cacheKey}`);
          const cachedData = monthCache[cacheKey];
          setAvailabilityData(cachedData);

          // Extract available dates
          const dates = Object.keys(cachedData.availabilities_by_date || {});
          setAvailableDates(dates);

          // Update time slots for selected date
          const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
          const availabilities =
            cachedData.availabilities_by_date?.[dateKey] || [];
          availabilities.sort(
            (a, b) =>
              new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
          );
          setAvailableTimes(availabilities);
          return;
        }

        // Fetch new data - get full month range, but only future dates
        console.log("Raw date inputs:", { selectedYear, selectedMonth });

        // Create dates in UTC to avoid timezone conversion issues
        // But ensure startDate is not in the past - Square only allows future bookings
        const today = new Date();
        const todayUTC = new Date(
          Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            0,
            0,
            0,
            0,
          ),
        );

        const monthStart = new Date(
          Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0),
        );
        const startDate = monthStart < todayUTC ? todayUTC : monthStart;
        const endDate = new Date(
          Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999),
        );

        console.log("UTC dates created:", {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        console.log("Date calculation debug:", {
          selectedDate: selectedDate.toISOString(),
          selectedMonth,
          selectedYear,
          today: today.toISOString(),
          todayUTC: todayUTC.toISOString(),
          monthStart: monthStart.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        console.log(
          `Fetching availability for ${
            selectedService.service_variation_id
          } from ${startDate.toISOString()} to ${endDate.toISOString()}`,
        );

        const data = await BookingService.searchAvailability(
          selectedService.service_variation_id,
          startDate,
          endDate,
        );

        // Cache the result
        setMonthCache((prev) => ({ ...prev, [cacheKey]: data }));
        setAvailabilityData(data);

        // Extract available dates
        const dates = Object.keys(data.availabilities_by_date || {});
        setAvailableDates(dates);

        // Update time slots for selected date
        const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
        const availabilities = data.availabilities_by_date?.[dateKey] || [];
        availabilities.sort(
          (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
        );
        setAvailableTimes(availabilities);
      } catch (err: any) {
        console.error("Error fetching availability:", err);
        setError("Failed to load available time slots. Please try again.");
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchAvailabilityData();
  }, [selectedService, selectedDate, showManualTimeSelection, monthCache]);

  // Update available times when selected date changes
  useEffect(() => {
    if (!availabilityData || !showManualTimeSelection) return;

    const dateKey = dayjs(selectedDate).format("YYYY-MM-DD");
    const availabilities =
      availabilityData.availabilities_by_date?.[dateKey] || [];
    availabilities.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
    setAvailableTimes(availabilities);
  }, [selectedDate, availabilityData, showManualTimeSelection]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setAdditionalServices([]); // Clear additional services when date changes
  };

  const handleMonthChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTimeSelection = (time: TimeSlot | null) => {
    setSelectedTime(time);
    setTimeAutoSelected(false);
    // Note: Don't clear additional services here - they'll be recalculated by useEffect
  };

  // Auto-scroll to payment section on mobile when time is selected
  useEffect(() => {
    if (selectedTime && paymentSectionRef.current) {
      // Check if we're on mobile (screen width < 1024px, which is lg breakpoint)
      const isMobile = window.innerWidth < 1024;
      
      if (isMobile) {
        // Small delay to ensure the payment form is rendered
        setTimeout(() => {
          paymentSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }, 300);
      }
    }
  }, [selectedTime]);

  // const handleShowPaymentForm = () => {
  //   if (!selectedService || !selectedTime || !user) {
  //     setError("Please select a service and time first");
  //     return;
  //   }
  //   setShowPaymentForm(true);
  // };

  // Recalculate additional service times when main service time changes
  useEffect(() => {
    if (!selectedTime || !selectedService) {
      return;
    }

    setAdditionalServices((currentServices) => {
      if (currentServices.length === 0) {
        return currentServices;
      }

      console.log(
        "Main service time changed, recalculating additional service times...",
      );

      const recalculatedServices = currentServices.map(
        (additionalService, index) => {
          let calculatedStartTime: Date;

          if (index === 0) {
            calculatedStartTime = new Date(selectedTime.start_at);
            const mainServiceDuration =
              selectedService.duration > 10000
                ? selectedService.duration / 60000
                : selectedService.duration;
            calculatedStartTime.setMinutes(
              calculatedStartTime.getMinutes() + mainServiceDuration,
            );
          } else {
            const previousService = currentServices[index - 1];
            calculatedStartTime = new Date(previousService.timeSlot.start_at);
            const previousDuration =
              previousService.service.duration > 10000
                ? previousService.service.duration / 60000
                : previousService.service.duration;
            calculatedStartTime.setMinutes(
              calculatedStartTime.getMinutes() + previousDuration,
            );
          }

          // Apply 30-minute rounding
          const minutes = calculatedStartTime.getMinutes();
          const remainder = minutes % 30;
          if (remainder !== 0) {
            calculatedStartTime.setMinutes(minutes + (30 - remainder));
          }

          const newTimeSlot = {
            ...additionalService.timeSlot,
            start_at: calculatedStartTime.toISOString(),
          };

          console.log(
            `Recalculated ${additionalService.service.name} to: ${dayjs(
              calculatedStartTime,
            )
              .tz("Australia/Melbourne")
              .format("h:mm A")}`,
          );

          return {
            ...additionalService,
            timeSlot: newTimeSlot,
          };
        },
      );

      return recalculatedServices;
    });
  }, [selectedTime, selectedService]);

  // Additional service handlers
  const handleAddAdditionalService = async () => {
    if (!selectedTime || !selectedService) {
      setError("Please select a main service and time first");
      return;
    }

    try {
      setIsLoadingServices(true);
      setError(null);
      console.log(
        "Fetching services and barbers for additional service dialog...",
      );

      const serviceList = await BookingService.getAllServices();
      console.log(
        `Fetched ${serviceList.length} services:`,
        serviceList.map((s) => s.name),
      );
      setAllServices(serviceList);

      const barbersByService: Record<number, TeamMember[]> = {};
      for (const service of serviceList) {
        try {
          const serviceBarbers = await BookingService.getBarbersForService(
            service.id,
          );
          const availableBarbers = serviceBarbers.filter(
            (barber) => !barber.is_owner,
          );
          barbersByService[service.id] = availableBarbers;
          console.log(
            `Service ${service.name}: ${availableBarbers.length} available barbers`,
          );
        } catch (err) {
          console.error(
            `Failed to fetch barbers for service ${service.id} (${service.name}):`,
            err,
          );
          barbersByService[service.id] = [];
        }
      }

      console.log(
        "All barbers by service:",
        Object.keys(barbersByService).map(
          (id) =>
            `${serviceList.find((s) => s.id === parseInt(id))?.name}: ${
              barbersByService[parseInt(id)].length
            } barbers`,
        ),
      );

      setAllBarbers(barbersByService);
      setShowServiceDialog(true);
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("Failed to load services. Please try again.");
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleSelectAdditionalService = async (service: Service) => {
    console.log(
      "🚀 handleSelectAdditionalService called with service:",
      service.name,
    );

    if (!selectedTime || !selectedService) {
      setError("Please select a main service and time first");
      return;
    }

    const mainBarber = selectedTime.appointment_segments?.[0]?.team_member_id;
    console.log("Main barber ID from selectedTime:", mainBarber);

    if (!mainBarber) {
      setError("Cannot determine main service barber");
      return;
    }

    console.log("allBarbers structure:", allBarbers);
    const flattenedBarbers = Object.values(allBarbers).flat();
    console.log("Flattened barbers count:", flattenedBarbers.length);

    let barberObj = flattenedBarbers.find(
      (barber) =>
        barber.square_up_id === mainBarber || barber.square_up_id == mainBarber,
    );

    if (!barberObj) {
      try {
        console.log(
          `Main barber (${mainBarber}) not found in allBarbers, fetching all team members...`,
        );
        const allTeamMembers = await BookingService.getTeamMembers();
        console.log(`Fetched ${allTeamMembers.length} team members from API`);

        barberObj = allTeamMembers.find(
          (barber) =>
            barber.square_up_id === mainBarber ||
            barber.square_up_id == mainBarber,
        );

        if (!barberObj) {
          console.error(
            `Main barber with ID ${mainBarber} not found in ${allTeamMembers.length} team members`,
          );
          setError("Main service barber not found");
          return;
        }
        console.log(
          `Found main barber: ${barberObj.first_name} (${barberObj.square_up_id})`,
        );
      } catch (error) {
        console.error("Error fetching team members:", error);
        setError("Failed to load barber information");
        return;
      }
    }

    try {
      // Calculate when the LAST added service ends
      let lastServiceEndTime;

      if (additionalServices.length === 0) {
        lastServiceEndTime = new Date(selectedTime.start_at);
        const mainServiceDuration =
          selectedService.duration > 10000
            ? selectedService.duration / 60000
            : selectedService.duration;
        lastServiceEndTime.setMinutes(
          lastServiceEndTime.getMinutes() + mainServiceDuration,
        );
      } else {
        const lastAddedService =
          additionalServices[additionalServices.length - 1];
        lastServiceEndTime = new Date(lastAddedService.timeSlot.start_at);
        const lastServiceDuration =
          lastAddedService.service.duration > 10000
            ? lastAddedService.service.duration / 60000
            : lastAddedService.service.duration;
        lastServiceEndTime.setMinutes(
          lastServiceEndTime.getMinutes() + lastServiceDuration,
        );
      }

      // Round up to next 30-minute increment
      const minutes = lastServiceEndTime.getMinutes();
      const remainder = minutes % 30;
      if (remainder !== 0) {
        lastServiceEndTime.setMinutes(minutes + (30 - remainder));
      }

      console.log(
        `Last service ends at: ${dayjs(lastServiceEndTime)
          .tz("Australia/Melbourne")
          .format("h:mm A")}`,
      );

      // Create the assigned time slot
      const assignedTimeSlot = {
        start_at: lastServiceEndTime.toISOString(),
        location_id: selectedTime.location_id,
        appointment_segments: [
          {
            team_member_id: mainBarber,
            service_variation_id: service.service_variation_id,
            duration_minutes:
              service.duration > 10000
                ? Math.round(service.duration / 60000)
                : service.duration,
            service_variation_version: 1,
          },
        ],
      };

      const newAdditionalService: AdditionalService = {
        service: service,
        barber: barberObj,
        timeSlot: assignedTimeSlot,
      };

      setAdditionalServices((prev) => [...prev, newAdditionalService]);
      setShowServiceDialog(false);
    } catch (error) {
      console.error("Error adding additional service:", error);
      setError("Failed to add additional service. Please try again.");
    }
  };

  // const handleRemoveAdditionalService = (index: number) => {
  //   setAdditionalServices((prev) => prev.filter((_, i) => i !== index));
  // };

  const handlePaymentStateChange = (processingPayment: boolean, creatingBooking: boolean) => {
    setIsProcessingPayment(processingPayment);
    setIsCreatingBooking(creatingBooking);
  };

  const renderBookingStatus = () => {
    if (timeAutoSelected && selectedTime) {
      return (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-green-800">
                Closest Available Time Selected
              </p>
              <p className="text-sm text-green-600 mt-1">
                Your appointment is automatically selected for the earliest
                available time
              </p>
              <div className="mt-2 p-2 bg-white rounded border">
                <p className="text-sm font-medium">
                  {dayjs(selectedTime.start_at).format("dddd, MMMM D, YYYY")} at{" "}
                  {dayjs(selectedTime.start_at).format("h:mm A")}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <button
              onClick={() => router.push("/book/barbers")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Choose a different barber/time
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!selectedService || selectedServices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  return (
    <VerificationGuard requireVerification={true}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mt-28">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Book Your Appointment
          </h1>
          <p className="mt-2 text-gray-600">
            Complete your booking and payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Time selection or selected time display */}
          <div className="space-y-6">
            {timeAutoSelected && !showManualTimeSelection ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Your Selected Time
                </h2>
                {renderBookingStatus()}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Select Your Preferred Time
                </h2>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                      Select your preferred date and time
                    </span>
                    <button
                      onClick={() => router.push("/book/barbers")}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Back to Barber Selection
                    </button>
                  </div>

                  <DateTimeSelector
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                    onMonthChange={handleMonthChange}
                    onTimeSelect={handleTimeSelection}
                    selectedTime={selectedTime}
                    availableTimes={availableTimes}
                    availableDates={availableDates}
                    isLoading={isLoadingAvailability}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden whitespace-nowrap md:hidden -mx-6">
            <div className="flex animate-marquee">
              {/* First set of images */}
              <MarqueeItems />
              {/* Duplicate set for seamless loop */}
              <MarqueeItems />
            </div>
          </div>

          {/* Right column - Booking summary and payment */}
          <div ref={paymentSectionRef} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-base font-semibold mb-3">BOOKING SUMMARY</h2>

            {/* {showPaymentForm ? (
              <StablePaymentForm
                selectedService={selectedService}
                selectedTime={selectedTime}
                selectedServices={[
                  ...selectedServices,
                  ...additionalServices.map((as) => as.service),
                ]}
                onPaymentComplete={() => {
                  console.log("✅ Payment completed successfully");
                  setBookingConfirmed(true);
                }}
                onCancel={() => {
                  console.log("❌ Payment cancelled");
                  setShowPaymentForm(false);
                }}
                onAddAdditionalService={handleAddAdditionalService}
                isLoadingServices={isLoadingServices}
                onPaymentStateChange={handlePaymentStateChange}
              />
            ) : (
              <>
                <BookingSummary
                  selectedService={selectedService}
                  selectedTime={selectedTime}
                  error={error}
                  onProceedToPayment={handleShowPaymentForm}
                  showPaymentForm={showPaymentForm}
                  selectedServices={[
                    ...selectedServices,
                    ...additionalServices.map((as) => as.service),
                  ]}
                />

                {/* Additional Services Section */}
                {/* {additionalServices.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium mb-2 text-blue-800">
                      Additional Services
                    </h3>
                    <div className="space-y-2">
                      {additionalServices.map((additionalService, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {additionalService.service.name}
                            </p>
                            <p className="text-gray-600">
                              {dayjs(additionalService.timeSlot.start_at)
                                .tz("Australia/Melbourne")
                                .format("h:mm A")}{" "}
                              -
                              {dayjs(additionalService.timeSlot.start_at)
                                .add(
                                  additionalService.service.duration > 10000
                                    ? additionalService.service.duration / 60000
                                    : additionalService.service.duration,
                                  "minute",
                                )
                                .tz("Australia/Melbourne")
                                .format("h:mm A")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              $
                              {(
                                additionalService.service.price_amount / 100
                              ).toFixed(2)}
                            </span>
                            <button
                              onClick={() =>
                                handleRemoveAdditionalService(index)
                              }
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                {/* Add Additional Service Button */}
                {/* {selectedTime && !showPaymentForm && (
                  <div className="mt-4">
                    <Button
                      onClick={handleAddAdditionalService}
                      variant="outline"
                      className="w-full bg-black text-white hover:bg-gray-800 border-black disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed"
                      disabled={!selectedTime || isLoadingServices}
                    >
                      {isLoadingServices ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading Services...
                        </div>
                      ) : selectedTime ? (
                        "Add Additional Service"
                      ) : (
                        "Select Time First"
                      )}
                    </Button>
                  </div>
                )} */}
              {/* </> */}
            {/* )}  */}
            
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 border border-red-400 bg-red-50 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <StablePaymentForm
                selectedService={selectedService}
                selectedTime={selectedTime}
                selectedServices={[
                  ...selectedServices,
                  ...additionalServices.map((as) => as.service),
                ]}
                onPaymentComplete={() => {
                  console.log("✅ Payment completed successfully");
                  setBookingConfirmed(true);
                }}
                onCancel={() => {
                  console.log("❌ Payment cancelled");
                  // setShowPaymentForm(false); // Commented since showPaymentForm is not used
                }}
                onAddAdditionalService={handleAddAdditionalService}
                isLoadingServices={isLoadingServices}
                onPaymentStateChange={handlePaymentStateChange}
              />
          </div>
        </div>

        <div className="overflow-hidden whitespace-nowrap hidden md:block mt-4">
          <div className="flex animate-marquee">
            {/* First set of images */}
            <MarqueeItems />
            {/* Duplicate set for seamless loop */}
            <MarqueeItems />
          </div>
        </div>
      </div>

      {/* Loading Screen Overlay */}
      {(isLoadingServices || isProcessingPayment || isCreatingBooking) && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-lg border">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isLoadingServices ? 'Loading Services' : 
               isProcessingPayment ? 'Processing Payment' :
               isCreatingBooking ? 'Creating Booking' : 'Loading'}
            </h3>
            <p className="text-gray-600">
              {isLoadingServices ? 'Please wait while we fetch available services...' :
               isProcessingPayment ? 'Please wait while we process your payment...' :
               isCreatingBooking ? 'Please wait while we create your booking...' : 'Please wait...'}
            </p>
          </div>
        </div>
      )}

      {/* Additional Service Selection Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
              Add Another Service
            </DialogTitle>
            <p className="text-gray-600 text-center mt-2">
              Select an additional service with your current barber. Services
              will be scheduled consecutively.
            </p>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            <div className="max-w-5xl mx-auto">
              <div className="grid gap-3 sm:gap-4">
                {allServices
                  .filter((service) => {
                    // Show all services - they'll be assigned to the same barber automatically
                    console.log(
                      `Showing service: ${service.name} (will use main barber for booking)`,
                    );
                    return true;
                  })
                  .map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleSelectAdditionalService(service)}
                      className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      {/* Service Info */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Duration:</span>
                            {service.duration > 10000
                              ? Math.round(service.duration / 60000)
                              : service.duration}{" "}
                            min
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Price:</span>$
                            {(service.price_amount / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Hover indicator */}
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-lg pointer-events-none transition-colors"></div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </VerificationGuard>
  );
}

export default function CleanAppointmentPage() {
  return <CleanAppointmentPageContent />;
}
