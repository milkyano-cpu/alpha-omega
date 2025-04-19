"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BookingService, TeamMember, Service } from "@/lib/booking-service";

export default function ServiceSelection() {
  const [barbers, setBarbers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<Record<number, Service[]>>({});
  const [expandedBarber, setExpandedBarber] = useState<number | null>(null);
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

    // Fetch barbers and their services
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use BookingService to fetch team members (barbers)
        const barberList = await BookingService.getTeamMembers();
        setBarbers(barberList);

        // Fetch services for each barber
        const servicesByBarber: Record<number, Service[]> = {};

        for (const barber of barberList) {
          try {
            // Use BookingService to fetch services for each barber
            const barberServices = await BookingService.getTeamMemberServices(
              barber.id
            );
            servicesByBarber[barber.id] = barberServices;
          } catch (serviceErr) {
            console.error(
              `Failed to fetch services for barber ${barber.id}:`,
              serviceErr
            );
            // Continue with next barber even if one fails
          }
        }

        setServices(servicesByBarber);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load barbers and services"
        );
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, router]);

  const handleBookService = (barberId: number, service: Service) => {
    // Store selected service and barber info in localStorage for the appointment page
    localStorage.setItem("selectedService", JSON.stringify(service));
    localStorage.setItem("selectedBarberId", barberId.toString());

    // Navigate to appointment page
    router.push("/book/appointment");
  };

  // Toggle accordion expansion
  const toggleAccordion = (barberId: number) => {
    setExpandedBarber(expandedBarber === barberId ? null : barberId);
  };

  // Calculate price range for services
  const getPriceRange = (services: Service[]): string => {
    if (!services || services.length === 0) return "$0.00 AUD";

    const prices = services.map((s) => s.price_amount / 100);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)} AUD`;
    }

    return `$${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} AUD`;
  };

  if (isLoading) {
    return (
      <main className="flex flex-col gap-20 mt-40">
        <section className="container mx-auto text-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading barbers and services...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col gap-20 mt-40">
        <section className="container mx-auto text-center py-20">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-20 mt-40">
      {barbers.length === 0 ? (
        <section className="container mx-auto text-center py-20">
          <p>No barbers available at the moment. Please check back later.</p>
        </section>
      ) : (
        barbers.map((barber) => (
          <section
            key={barber.id}
            className="container mx-auto flex flex-col md:flex-row justify-center items-start py-10 gap-8 px-4"
          >
            <div className="w-full md:w-80">
              <Image
                src={"/assets/barber-1.png"}
                width={500}
                height={500}
                alt={`${barber.first_name} ${barber.last_name}`}
              />
            </div>

            <div className="w-[1px] h-96 bg-[#D9D9D9] hidden md:block" />

            <div className="flex flex-col gap-4 w-full md:w-1/3">
              <h1 className="text-5xl font-bold">
                {barber.first_name} {barber.last_name}
              </h1>
              <p className="text-lg">
                [IG@{barber.first_name.toLowerCase()}.barber] ({barber.status})
              </p>
              <div className="w-full h-[2px] bg-[#3D3D3D]" />

              {/* Services Accordion */}
              <div className="mt-4">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(barber.id)}
                  className="w-full flex justify-between items-center bg-zinc-700 text-white rounded-lg p-4 hover:bg-zinc-600 transition-colors"
                >
                  <div className="text-lg font-medium">
                    View Services
                    <span className="ml-2 text-gray-300 text-base">
                      ({getPriceRange(services[barber.id] || [])})
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      expandedBarber === barber.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Accordion Content */}
                {expandedBarber === barber.id && (
                  <div className="mt-4 space-y-4">
                    {services[barber.id]?.length > 0 ? (
                      services[barber.id].map((service) => (
                        <div
                          key={service.id}
                          className="border border-gray-300 rounded-lg overflow-hidden"
                        >
                          <div className="bg-zinc-700 text-white p-4 flex justify-between items-center">
                            <div>
                              {/* Just display the service name as-is, since it already includes the barber info */}
                              <h3 className="font-bold text-lg">
                                {service.name}
                              </h3>
                              <p className="text-gray-300">
                                ${(service.price_amount / 100).toFixed(2)} AUD •{" "}
                                {service.duration > 10000
                                  ? Math.round(service.duration / 60000)
                                  : service.duration}{" "}
                                min{" "}
                                {service.price_amount > 6000 &&
                                  "+ [15% Surcharge On Sundays]"}
                              </p>
                            </div>
                            <Button
                              onClick={() =>
                                handleBookService(barber.id, service)
                              }
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Book Now
                            </Button>
                          </div>

                          {service.description && (
                            <div className="p-4 bg-white">
                              <p>
                                {service.description ||
                                  "Experience a professional cut tailored to your style."}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4">
                        No services available for this barber.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        ))
      )}
    </main>
  );
}
