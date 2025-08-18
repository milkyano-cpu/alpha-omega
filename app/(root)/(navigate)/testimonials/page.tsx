"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
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
    <main className="flex flex-col gap-20">
      <section className="flex flex-col gap-8 px-4 mt-40 container mx-auto">
        <div className="w-full md:w-max mx-auto">
          <Image
            src={"/assets/testi-1.png"}
            width={500}
            height={500}
            alt="Testimonials"
          />
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex md:justify-center gap-8 w-max md:w-full">
            <div className="w-80 md:w-md flex flex-col gap-6">
              <Image
                src={"/assets/testi-carousel-1.png"}
                width={500}
                height={500}
                alt="The Haircut"
              />

              <Button variant={"secondary"} className="w-full" onClick={handleBookBarber}>
                BOOK BARBER
              </Button>
            </div>
            <div className="w-80 md:w-md flex flex-col gap-6">
              <Image
                src={"/assets/testi-carousel-2.png"}
                width={500}
                height={500}
                alt="The Haircut"
              />

              <Button variant={"secondary"} className="w-full" onClick={handleBookBarber}>
                BOOK BARBER
              </Button>
            </div>
            <div className="w-80 md:w-md flex flex-col gap-6">
              <Image
                src={"/assets/testi-carousel-3.png"}
                width={500}
                height={500}
                alt="The Haircut"
              />

              <Button variant={"secondary"} className="w-full" onClick={handleBookBarber}>
                BOOK BARBER
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-8 px-4 text-center container mx-auto mb-40">
        <div className="w-full md:w-max mx-auto">
          <Image
            src={"/assets/testi-2.png"}
            width={500}
            height={500}
            alt="Need More Convincing?"
          />
        </div>

        <p>
          We have the customers and the reviews to prove it our specialty is one
          of the best in Melbourne.
        </p>

        <div className="w-full overflow-x-auto">
          <div className="flex gap-4 md:gap-8 w-max md:w-full md:justify-center">
            <div className="w-40 md:w-[350px] md:h-[600px] h-80 bg-[#D9D9D9] rounded-md"></div>

            <div className="w-40 md:w-[350px] md:h-[600px] h-80 bg-[#D9D9D9] rounded-md"></div>

            <div className="w-40 md:w-[350px] md:h-[600px] h-80 bg-[#D9D9D9] rounded-md"></div>
          </div>
        </div>
      </section>
    </main>
  );
}
