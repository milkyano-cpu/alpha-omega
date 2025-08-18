"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ServicesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleBookBarber = () => {
    if (isAuthenticated) {
      router.push("/book/services");
    } else {
      router.push("/login?returnUrl=/book/services");
    }
  };

  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col gap-6 sm:gap-8 px-4 sm:px-6 pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-20 max-w-4xl container mx-auto">
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-md sm:max-w-lg">
            <Image
              src={"/assets/services-1.png"}
              width={500}
              height={500}
              alt="What We Do For You"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Our Premium Services
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            From precision haircuts and classic shaves to beard styling and
            premium treatments, our services are designed to keep you looking
            sharp and feeling confident.
          </p>
        </div>
      </section>

      {/* Services Showcase Section */}
      <section className="bg-gradient-to-b from-gray-900 to-black py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:gap-12 items-center text-center">
            <div className="w-full flex justify-center">
              <div className="relative w-full max-w-md sm:max-w-lg">
                <Image
                  src={"/assets/services-2.png"}
                  width={500}
                  height={500}
                  alt="Types Of Service"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                Complete Grooming Experience
              </h2>
              <p className="text-gray-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
                We offer a full range of services, including expert haircuts to
                beard sculpting. Each service is tailored to suit your style,
                ensuring you leave feeling your best.
              </p>
            </div>

            {/* Service Cards */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-5xl px-2">
              {/* Haircut Service */}
              <div className="bg-white rounded-xl shadow-xl md:hover:scale-105 transition-transform duration-300 mx-2 md:mx-0">
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Premium Haircut
                  </h3>

                  <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                    A precision-crafted haircut tailored to your style, ensuring
                    sharp lines, clean fades, or classic trims that leave you
                    looking your best.
                  </p>

                  <div className="relative w-full mb-4 sm:mb-6">
                    <Image
                      src={"/assets/services-3.png"}
                      width={500}
                      height={500}
                      alt="Premium Haircut"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      variant={"secondary"}
                      onClick={handleBookBarber}
                      className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors min-h-[44px]"
                    >
                      BOOK NOW
                    </Button>

                    <a
                      href="#"
                      className="block text-center text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors py-2"
                    >
                      Learn More →
                    </a>
                  </div>
                </div>
              </div>

              {/* Haircut + Beard Service */}
              <div className="bg-white rounded-xl shadow-xl md:hover:scale-105 transition-transform duration-300 mx-2 md:mx-0">
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Haircut + Beard Styling
                  </h3>

                  <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                    A complete grooming package that combines a tailored haircut
                    with expert beard shaping and styling for a polished,
                    cohesive look.
                  </p>

                  <div className="relative w-full mb-4 sm:mb-6">
                    <Image
                      src={"/assets/services-4.png"}
                      width={500}
                      height={500}
                      alt="Haircut and Beard Styling"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      variant={"secondary"}
                      onClick={handleBookBarber}
                      className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors min-h-[44px]"
                    >
                      BOOK NOW
                    </Button>

                    <a
                      href="#"
                      className="block text-center text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors py-2"
                    >
                      Learn More →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {/* <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:gap-12 items-center">
            <div className="text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Our Craftsmanship
              </h2>
              <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                See the quality and attention to detail that goes into every cut
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-4xl">
              <div className="relative group overflow-hidden rounded-xl shadow-lg">
                <Image
                  src={"/assets/services-5.png"}
                  width={500}
                  height={500}
                  alt="Barber Shop Craftsmanship"
                  className="w-full h-auto transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>

              <div className="relative group overflow-hidden rounded-xl shadow-lg">
                <Image
                  src={"/bg/services-1.png"}
                  width={500}
                  height={500}
                  alt="Professional Barber Services"
                  className="w-full h-auto transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Reviews Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:gap-12 items-center">
            <div className="text-center space-y-4 max-w-4xl">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Why Choose Our Services
              </h2>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                A precision-crafted haircut tailored to your style, ensuring
                sharp lines, clean fades, or classic trims that leave you
                looking your best. Our haircuts are more than just a
                trim—they&apos;re crafted to match your unique style and
                personality. Whether it&apos;s a classic cut or a modern look,
                we deliver precision, detail, and confidence every time.
              </p>
            </div>

            {/* <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Customer Experiences
            </h3> */}

            {/* Horizontal Scroll on Mobile, Grid on Desktop */}
            {/* <div className="w-full">
              <div className="flex md:justify-center gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-8">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex-shrink-0 w-72 sm:w-80 md:w-full snap-center">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                      <div className="relative">
                        <Image
                          src={"/assets/services-carousel-1.png"}
                          width={500}
                          height={500}
                          alt={`Customer Review ${index}`}
                          className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      
                      <div className="p-4 sm:p-6">
                        <Button 
                          variant={"secondary"} 
                          className="w-full py-3 text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors" 
                          onClick={handleBookBarber}
                        >
                          BOOK YOUR APPOINTMENT
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-6 sm:p-8 text-center text-white w-full max-w-2xl shadow-xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-4">
                Ready to Experience Premium Grooming?
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mb-6">
                Book your appointment today and discover the difference
                professional care makes.
              </p>
              <Button
                variant={"secondary"}
                onClick={handleBookBarber}
                className="px-8 py-3 text-base font-semibold bg-white text-black hover:bg-gray-100 transition-colors"
              >
                BOOK NOW
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
