import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col gap-20">
      <section className="flex flex-col gap-8 px-4 mt-40 max-w-2xl text-center items-center mb-40 container mx-auto">
        <div className="w-full md:w-max self-center">
          <Image
            src={"/assets/gallery-1.png"}
            width={500}
            height={500}
            alt="Gallery"
          />
        </div>

        <p>
          Browse our gallery to see the artistry and precision that define every
          cut and style. Discover why Alpha Omega is the go-to destination for
          exceptional grooming.
        </p>

        <Button className="bg-[#525252] rounded-full py-2">Haircuts</Button>
        <Button className="bg-[#525252] rounded-full py-2">Barbershop</Button>
      </section>
    </main>
  );
}
