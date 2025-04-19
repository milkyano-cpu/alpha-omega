"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface TeamMember {
  id: number;
  square_up_id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface Service {
  id: number;
  team_member_id: number;
  name: string;
  description: string;
  price_amount: number;
  price_currency: string;
  duration: number;
  service_variation_id: string;
  square_catalog_id: string;
}

export default function ServiceSelection() {
  const [barbers, setBarbers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<Record<number, Service[]>>({});
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
        // Fetch team members (barbers)
        const teamMemberResponse = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
          }/team-members`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!teamMemberResponse.ok) {
          throw new Error("Failed to fetch barbers");
        }

        const teamMemberData = await teamMemberResponse.json();
        const barberList = teamMemberData.data || [];
        setBarbers(barberList);

        // Fetch services for each barber
        const servicesByBarber: Record<number, Service[]> = {};

        for (const barber of barberList) {
          const serviceResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
            }/services/team-member/${barber.id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (!serviceResponse.ok) {
            console.error(`Failed to fetch services for barber ${barber.id}`);
            continue;
          }

          const serviceData = await serviceResponse.json();
          servicesByBarber[barber.id] = serviceData.data || [];
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
            className="container mx-auto flex flex-col md:flex-row justify-center items-center py-20 gap-8 px-4"
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
              <h1>
                {barber.first_name} {barber.last_name}
              </h1>
              <p>
                [IG@{barber.first_name.toLowerCase()}.barber] ({barber.status})
              </p>
              <div className="w-full h-[2px] bg-[#3D3D3D]" />

              {services[barber.id]?.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {services[barber.id].map((service) => (
                    <AccordionItem
                      key={service.id}
                      value={`service-${service.id}`}
                    >
                      <AccordionTrigger className="bg-[#3D3D3D] text-white rounded-xl px-6 py-4 w-full">
                        <b>{service.name}</b>
                        <br />
                        <sub>
                          ${(service.price_amount / 100).toFixed(2)}{" "}
                          {service.price_currency} ・ {service.duration > 10000 ? Math.round(service.duration / 60000) : service.duration} min
                        </sub>
                      </AccordionTrigger>
                      <AccordionContent className="px-10 py-4">
                        <p>
                          {service.description ||
                            "Experience a professional cut tailored to your style."}
                        </p>
                        <Button
                          onClick={() => handleBookService(barber.id, service)}
                          className="w-full mt-4"
                        >
                          BOOK NOW
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-center py-4">
                  No services available for this barber.
                </p>
              )}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
