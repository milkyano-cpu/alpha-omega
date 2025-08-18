"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BookingService, TeamMember, Service } from "@/lib/booking-service";
import { preloadBarberImages } from "@/lib/barber-images";
import { PlusCheckbox } from "@/components/plus-checkbox";
import { VerificationGuard } from "@/components/verification-guard";

function ServiceSelectionContent() {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Record<number, TeamMember[]>>({});
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/book/services");
      return;
    }

    // Fetch services and their barbers (reversed flow)
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const serviceList = await BookingService.getAllServices();
        setServices(serviceList);

        const barbersByService: Record<number, TeamMember[]> = {};
        for (const service of serviceList) {
          try {
            const serviceBarbers = await BookingService.getBarbersForService(
              service.id,
            );
            // Filter out barbers with is_owner=true
            const availableBarbers = serviceBarbers.filter(
              (barber) => !barber.is_owner,
            );
            barbersByService[service.id] = availableBarbers;
          } catch (barberErr) {
            console.error(
              `Failed to fetch barbers for service ${service.id}:`,
              barberErr,
            );
          }
        }

        setBarbers(barbersByService);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load services and barbers",
        );
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Preload barber images for better performance
    preloadBarberImages();
  }, [isAuthenticated, router]);

  const handleServiceToggle = (service: Service, checked: boolean) => {
    setSelectedServices((prev) => {
      if (checked) {
        // Add service if not already selected
        return prev.some((s) => s.id === service.id)
          ? prev
          : [...prev, service];
      } else {
        // Remove service if currently selected
        return prev.filter((s) => s.id !== service.id);
      }
    });
  };

  const handleContinueToBarbers = () => {
    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }

    // Store selected services and navigate to barbers page
    localStorage.setItem("selectedServices", JSON.stringify(selectedServices));
    // Use the first service ID for barber selection compatibility
    router.push(`/book/barbers?serviceId=${selectedServices[0].id}`);
  };

  const calculateTotalPrice = () => {
    return selectedServices.reduce(
      (total, service) => total + service.price_amount,
      0,
    );
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, service) => {
      const duration =
        service.duration > 10000
          ? Math.round(service.duration / 60000)
          : service.duration;
      return total + duration;
    }, 0);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">
            Loading Services
          </h2>
          <p className="mt-2 text-gray-600">
            Finding the best barbers for you...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Services
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-900 hover:bg-gray-800"
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <VerificationGuard requireVerification={true}>
      <main className="min-h-screen bg-white">
      <div className="mx-auto px-4 py-6 pt-20 pb-32 mt-28">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Services
          </h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Select one or more services you&apos;d like to book
          </p>
        </div>

        {services.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Services Available
            </h3>
            <p className="text-gray-500">
              No services are currently available. Please check back later or
              contact us directly.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-3">
            {services
              .filter(
                (service) =>
                  barbers[service.id] && barbers[service.id].length > 0,
              )
              .map((service) => {
                const isSelected = selectedServices.some(
                  (s) => s.id === service.id,
                );
                return (
                  <div
                    key={service.id}
                    className={`bg-white rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-gray-900 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="p-4">
                      {/* Service Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {service.description}
                            </p>
                          )}
                        </div>

                        <PlusCheckbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleServiceToggle(service, checked)
                          }
                          className="ml-3 mt-1"
                        />
                      </div>

                      {/* Service Details */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {/* Price */}
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                            <span className="font-semibold text-gray-900">
                              ${(service.price_amount / 100).toFixed(2)}
                            </span>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {service.duration > 10000
                                ? Math.round(service.duration / 60000)
                                : service.duration}{" "}
                              min
                            </span>
                          </div>

                          {/* Barber count */}
                          {/* {barbers[service.id] && (
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>
                                 {barbers[service.id].length} barber{barbers[service.id].length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )} */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Continue Button - Sticky Bottom */}
        {selectedServices.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-2xl">
            <div className="max-w-md mx-auto">
              {/* Summary */}
              <div className="flex justify-between items-center mb-3 text-sm">
                <span className="text-gray-600">
                  {selectedServices.length} service
                  {selectedServices.length !== 1 ? "s" : ""} selected
                </span>
                <span className="font-semibold text-gray-900">
                  ${(calculateTotalPrice() / 100).toFixed(2)} •{" "}
                  {calculateTotalDuration()} min
                </span>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinueToBarbers}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 text-base"
              >
                Continue
                <span className="ml-2">→</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
    </VerificationGuard>
  );
}

export default function ServiceSelection() {
  return <ServiceSelectionContent />;
}
