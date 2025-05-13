"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BookingService, TeamMember, Service } from "@/lib/booking-service";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function ServiceSelection() {
  const [barbers, setBarbers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<Record<number, Service[]>>({});
  const [expandedBarber, setExpandedBarber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [open, setOpen] = useState(false);
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
              barber.id,
            );
            servicesByBarber[barber.id] = barberServices;
          } catch (serviceErr) {
            console.error(
              `Failed to fetch services for barber ${barber.id}:`,
              serviceErr,
            );
          }
        }

        setServices(servicesByBarber);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load barbers and services",
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
    <main className="grid md:grid-cols-3 grid-cols-2 mt-40 mb-72">
      {barbers.length === 0 ? (
        <section className="container mx-auto text-center py-20">
          <p>No barbers available at the moment. Please check back later.</p>
        </section>
      ) : (
        barbers.map((barber) => (
          <section
            key={barber.id}
            className="container mx-auto flex flex-col justify-center items-center text-center gap-8 px-2 py-6"
          >
            <div className="w-full md:w-80">
              <div className="rounded-lg md:rounded-2xl overflow-hidden shadow-md bg-black">
                <Image
                  src={"/assets/barber-1.png"}
                  width={500}
                  height={500}
                  alt={`${barber.first_name} ${barber.last_name}`}
                  className="object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold">
                {barber.first_name} {barber.last_name}
              </h1>

              <p className="text-lg">🇪🇸 | Espanól</p>
              <p className="text-lg">
                [IG@{barber.first_name.toLowerCase()}.barber]{" "}
                <span className="ml-1">({barber.status})</span>
              </p>
              <div className="w-full h-[1px] bg-gray-900" />

              {/* Services Accordion */}
              <div className="mt-4 max-w-md relative">
                {/* Accordion Content */}
                {expandedBarber === barber.id && (
                  <div className="mt-18 space-y-4 absolute w-full -z-10">
                    {services[barber.id]?.length > 0 ? (
                      services[barber.id].map((service) => (
                        <div
                          key={service.id}
                          className="bg-[#545454] rounded-xl overflow-hidden mb-4"
                        >
                          <div className="p-2">
                            <div className="flex flex-col gap-3">
                              <div>
                                <h3 className="font-bold text-lg text-white">
                                  {service.name}
                                </h3>
                                <h3 className="font-bold text-white my-4">
                                  ${service.price_amount}
                                </h3>

                                <p className="text-gray-300">
                                  ${(service.price_amount / 50).toFixed(0)} +
                                  [15% Surcharge On Sundays]
                                </p>
                              </div>
                              <Button
                                onClick={() => setOpen(true)}
                                className="bg-[#292929] text-white w-full text-2xl px-6 py-2 rounded-xl"
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>

                          <Dialog open={open} onOpenChange={setOpen}>
                            <DialogContent className="max-w-md bg-white rounded-xl">
                              <DialogHeader className="text-center text-xl font-bold mb-4">
                                BOOK YOUR APPOINTMENT
                              </DialogHeader>

                              <div
                                style={{ whiteSpace: "pre-line" }}
                                className="p-4 border rounded-md space-y-4 text-sm text-gray-800 max-h-96 overflow-y-auto"
                              >
                                {policy}
                              </div>

                              <div className="flex items-center space-x-2 pt-4">
                                <Checkbox
                                  id="agree"
                                  checked={agreed}
                                  onCheckedChange={() => setAgreed(!agreed)}
                                />
                                <label
                                  htmlFor="agree"
                                  className="text-sm font-medium leading-none"
                                >
                                  Tick to Agree
                                </label>
                              </div>

                              <Button
                                disabled={!agreed}
                                onClick={() =>
                                  agreed &&
                                  handleBookService(barber.id, service)
                                }
                                className="w-full mt-4"
                              >
                                Book Now
                              </Button>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-4">
                        No services available for this barber.
                      </p>
                    )}
                  </div>
                )}

                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(barber.id)}
                  className="w-full flex justify-center text-[#333333] rounded-lg p-4"
                  aria-expanded={expandedBarber === barber.id}
                  aria-controls={`services-${barber.id}`}
                >
                  {expandedBarber === barber.id ? (
                    <ChevronUp className="h-12 w-12 -z-10" />
                  ) : (
                    <ChevronDown className="h-12 w-12 animate-pulse -z-10" />
                  )}
                </button>
              </div>
            </div>
          </section>
        ))
      )}
    </main>
  );
}

const policy = `
We pride ourselves in offering a high quality of service and that begins with appointment based bookings. Our online system allows you to pick a stylist and time that’s convenient for you, and if you can’t make it you can reschedule within 24 hours of your appointment.

Secure transactions
Transactions are handled with bank-grade security

Alpha Omega Mens Grooming
Booking Policy & Client Experience Standards
Where your confidence is crafted with precision.

⸻

Booking Deposit

To confirm your appointment, a 50% non-refundable deposit is required at the time of booking. This guarantees your time with our artist and will be deducted from the total cost of your service.

By proceeding with the deposit, you acknowledge and agree to the full terms and policies outlined below.

⸻

Rescheduling

Appointments may be rescheduled with a minimum of 24 hours’ notice. Your deposit will be transferred to the new appointment. Rescheduling within 24 hours will result in the deposit being forfeited.

⸻

Cancellations

To respect the time and preparation of our team, we do not accept cancellations within 24 hours of your appointment. Deposits are non-refundable in these cases.

⸻

No Shows

Clients who miss an appointment without notice will be charged 100% of the scheduled service. Repeat no-shows may be removed from our client list.

⸻

Late Arrivals
    •    A 10-minute grace period applies.
    •    Arrivals beyond this may lead to a shortened service or loss of your appointment and deposit.
    •    We always strive to run on time to respect every guest’s schedule.

⸻

Confirmation & Communication

You’ll receive a confirmation and reminder via SMS or email before your booking. Please confirm promptly to avoid any confusion or cancellation.

⸻

Studio Etiquette

To preserve the luxury atmosphere:
    •    Please arrive solo unless accompanying a minor.
    •    Phones on silent are appreciated.
    •    Kindness, respect, and professionalism are expected from both sides.

⸻

VIP Privileges

Clients with consistent attendance and respect for our policies may receive access to:
    •    Priority bookings
    •    Exclusive treatments
    •    Private events & launches

⸻

Legal Notice

By paying your deposit and booking an appointment, you agree to all terms listed. These policies are binding and in place to protect the integrity of our studio and ensure a premium experience for all clients.

⸻

Thank you for choosing Alpha Omega — where every detail is designed to elevate your confidence.

`;
