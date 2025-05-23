"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BookingService, TeamMember, Service } from "@/lib/booking-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function ServiceSelection() {
  const [barbers, setBarbers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<Record<number, Service[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<TeamMember | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreed, setAgreed] = useState(false);
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

  const handleViewServices = (barber: TeamMember) => {
    setSelectedBarber(barber);
    setShowServicesModal(true);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setShowServicesModal(false);
    setShowTermsModal(true);
  };

  const handleBookService = () => {
    if (selectedBarber && selectedService && agreed) {
      localStorage.setItem("selectedService", JSON.stringify(selectedService));
      localStorage.setItem("selectedBarberId", selectedBarber.id.toString());
      router.push("/book/appointment");
    }
  };

  const resetSelection = () => {
    setSelectedService(null);
    setAgreed(false);
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
    <main className="container mx-auto px-4 py-10 mt-20 mb-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Barber</h1>
        <p className="text-lg text-gray-600">Select a barber to view their available services</p>
      </div>

      {barbers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No barbers available at the moment. Please check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {barbers
            .filter((barber) => services[barber.id] && services[barber.id].length > 0)
            .map((barber) => (
            <div
              key={barber.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="aspect-square bg-black relative">
                <Image
                  src={"/assets/barber-1.png"}
                  width={400}
                  height={400}
                  alt={`${barber.first_name} ${barber.last_name}`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h2 className="text-2xl font-bold">{barber.first_name}</h2>
                  <p className="text-sm opacity-90">{barber.status}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-xl">🇪🇸</span>
                    <span>Español</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    @{barber.first_name.toLowerCase()}.barber
                  </p>
                  {services[barber.id] && (
                    <p className="text-sm text-gray-500">
                      {services[barber.id].length} services available
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handleViewServices(barber)}
                  className="w-full bg-black text-white hover:bg-gray-800"
                  disabled={!services[barber.id] || services[barber.id].length === 0}
                >
                  View Services
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Services Modal */}
      <Dialog open={showServicesModal} onOpenChange={setShowServicesModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold">
              {selectedBarber ? `${selectedBarber.first_name}'s Services` : 'Services'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] py-4">
            {selectedBarber && services[selectedBarber.id] ? (
              <div className="grid gap-4">
                {services[selectedBarber.id].map((service) => (
                  <div
                    key={service.id}
                    className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-all"
                    onClick={() => handleSelectService(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500">
                            Duration: {service.duration > 10000 ? Math.round(service.duration / 60000) : service.duration} min
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold">${(service.price_amount / 100).toFixed(2)}</p>
                        <p className="text-xs text-gray-500">+15% on Sundays</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">No services available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms Modal */}
      <Dialog open={showTermsModal} onOpenChange={(open) => {
        setShowTermsModal(open);
        if (!open) resetSelection();
      }}>
        <DialogContent className="max-w-md bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Book Your Appointment
            </DialogTitle>
          </DialogHeader>

          {selectedService && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold">{selectedService.name}</h4>
              <p className="text-2xl font-bold mt-1">${(selectedService.price_amount / 100).toFixed(2)}</p>
            </div>
          )}

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
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label
              htmlFor="agree"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              I agree to the terms and conditions
            </label>
          </div>

          <Button
            disabled={!agreed}
            onClick={handleBookService}
            className="w-full mt-4"
          >
            Proceed to Booking
          </Button>
        </DialogContent>
      </Dialog>
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
