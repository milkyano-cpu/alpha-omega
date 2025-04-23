"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
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
        const barberList = await BookingService.getTeamMembers();
        setBarbers(barberList);

        // Auto-expand first barber if only one exists
        if (barberList.length === 1) {
          setExpandedBarber(barberList[0].id);
        }

        const servicesByBarber: Record<number, Service[]> = {};
        for (const barber of barberList) {
          try {
            const barberServices = await BookingService.getTeamMemberServices(
              barber.id
            );
            servicesByBarber[barber.id] = barberServices;
          } catch (serviceErr) {
            console.error(
              `Failed to fetch services for barber ${barber.id}:`,
              serviceErr
            );
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
    localStorage.setItem("selectedService", JSON.stringify(service));
    localStorage.setItem("selectedBarberId", barberId.toString());
    router.push("/book/appointment");
  };

  const toggleAccordion = (barberId: number) => {
    setExpandedBarber(expandedBarber === barberId ? null : barberId);
  };

  // Calculate price range for services
  const getPriceRange = (services: Service[]): string => {
    if (!services || services.length === 0) return "$0 AUD";
    const prices = services.map((s) => s.price_amount / 50);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice
      ? `$${minPrice} AUD`
      : `$${minPrice}-$${maxPrice} AUD`;
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
              <div className="rounded-lg overflow-hidden shadow-md">
                <Image
                  src={"/assets/barber-1.png"}
                  width={500}
                  height={500}
                  alt={`${barber.first_name} ${barber.last_name}`}
                  className="object-cover"
                />
              </div>
            </div>

            <div className="w-[1px] h-96 bg-[#D9D9D9] hidden md:block" />

            <div className="flex flex-col gap-4 w-full md:w-1/3">
              <h1 className="text-4xl md:text-5xl font-bold">
                {barber.first_name} {barber.last_name}
              </h1>
              <p className="text-lg">
                [IG@{barber.first_name.toLowerCase()}.barber]{" "}
                <span className="ml-1">({barber.status})</span>
              </p>
              <div className="w-full h-[1px] bg-green-500" />

              {/* Services Accordion */}
              <div className="mt-4 max-w-md">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(barber.id)}
                  className="w-full flex justify-between items-center bg-[#333333] text-white rounded-lg p-4 hover:bg-[#3d3d3d] transition-colors"
                  aria-expanded={expandedBarber === barber.id}
                  aria-controls={`services-${barber.id}`}
                >
                  <div className="text-lg font-medium">
                    View Services
                    <span className="ml-2 text-gray-300 text-sm">
                      ({getPriceRange(services[barber.id] || [])})
                    </span>
                  </div>
                  {expandedBarber === barber.id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>

                {/* Accordion Content */}
                {expandedBarber === barber.id && (
                  <div className="mt-4 space-y-4">
                    {services[barber.id]?.length > 0 ? (
                      services[barber.id].map((service) => (
                        <div
                          key={service.id}
                          className="bg-[#111111] rounded-lg overflow-hidden mb-4"
                        >
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row justify-between gap-3">
                              <div>
                                <h3 className="font-bold text-lg text-white">
                                  {service.name}
                                </h3>
                                <p className="text-gray-300 text-sm">
                                  ${(service.price_amount / 50).toFixed(0)} +
                                  [15% Surcharge On Sundays]
                                </p>
                              </div>
                              <Button
                                onClick={() =>
                                  handleBookService(barber.id, service)
                                }
                                className="bg-green-600 hover:bg-green-700 text-white text-base px-6 py-2 rounded"
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
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
