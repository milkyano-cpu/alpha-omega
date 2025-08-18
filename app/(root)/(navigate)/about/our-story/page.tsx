import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col gap-20 -mt-20">
      <section className="bg-[url('/bg/about-1.png')] bg-cover bg-center h-80 md:h-[600px] md:mt-20 flex flex-col justify-center items-center text-center text-white"></section>

      <section className="flex flex-col md:grid grid-cols-2 gap-8 px-4 md:w-4xl container mx-auto">
        <div className="w-full md:w-max mx-auto col-span-2">
          <Image
            src={"/assets/about-1.png"}
            width={500}
            height={500}
            alt="Our Story"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-[#D9D9D9] rounded-xl aspect-square w-full flex justify-center items-center">
            <Image
              src={"/assets/ao-pixelate-black.png"}
              width={300}
              height={300}
              alt=""
            />
          </div>
          <h4 className="bg-gray-100 px-4 py-2 rounded-lg inline-block">
            HOW IT BEGINS
          </h4>
          <p>
            Two years ago, I arrived in Australia from Greece with no money, a
            dream in my heart and a determination to succeed.{" "}
            <span className="bg-[#cccccc] text-black">
              The journey was far from easy — filled with challenges, long days
              of hard work, and countless sacrifices.
            </span>{" "}
            But through perseverance, dedication, and an unwavering focus on my
            goals, I was able to turn my vision into reality.{" "}
            <b>
              <i>
                None of this would have been possible without my now-business
                partner
              </i>
            </b>
            . A Serbian native who grew up in Australia but spent years living
            in Serbia, he brought a unique perspective to the craft of
            barbering. When I first joined his barbershop, it was a small
            operation with four barbers. Through endless discussions and a
            shared passion for excellence, the business expanded and we grew
            together. 
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-[#D9D9D9] rounded-xl aspect-square w-full flex justify-center items-center">
            <Image
              src={"/assets/ao-pixelate-black.png"}
              width={300}
              height={300}
              alt=""
            />
          </div>
          <h4 className="bg-gray-100 text-xl md:text-2xl px-4 py-2 rounded-lg inline-block">
            WHY WE CREATE BARBERSHOP
          </h4>
          <p>
            As our collaboration grew stronger, we decided it was time to create
            something new - something that wasn’t existing - a space that would
            redefine men’s grooming.{" "}
            <b>
              <i>
                {" "}
                Inspired by the fusion of traditional barbering and modern
                luxury, we created a one of a kind environment that blends
                premium services, innovative technology, and a stunning interior
                designed to make every visit unforgettable 
              </i>
            </b>
          </p>
        </div>

        <p className="text-center col-span-2">
          Welcome to the next chapter in men’s grooming—where street-inspired
          luxuries meets timeless elegance.
        </p>
      </section>

      <section className="flex flex-col justify-center items-center gap-8 px-4 container mx-auto">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/about-2.png"}
            width={500}
            height={500}
            alt="Our Values"
          />
        </div>

        <p>
          At Alpha Omega, we stand by a commitment to excellence, authenticity,
          and the art of grooming.
        </p>

        <p>
          Our values shape every experience, from the first consultation to the
          final touch, ensuring every client leaves with confidence and style
          that lasts.
        </p>
      </section>

      <section className="flex flex-col items-center gap-8 bg-[#F8F8F8] py-10 px-4">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/about-4.png"}
            width={500}
            height={500}
            alt="Our Goals"
          />
        </div>

        <p>
          Our goal is to provide luxury services that goes beyond the ordinary,
          leaving an indelible mark of refinement and excellence on each of our
          clients
        </p>

        <div className="bg-[#D9D9D9] rounded-xl aspect-square w-full max-w-2xl" />
      </section>

      <section className="flex flex-col items-center gap-8 px-4 container mx-auto">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/about-5.png"}
            width={500}
            height={500}
            alt="Why We Stand Out"
          />
        </div>

        <p>
          Alpha Omega proudly represents the pinnacle of Australian barbershops,
          delivering a standard of excellence that rivals any in the world. We
          draw inspiration from global grooming trends, infusing them with the
          laid-back yet refined Australian spirit. Whether you’re a local, a
          professional, or just passing through, our goal is to provide a
          barbershop experience that keeps you coming back. At Alpha Omega,
          we’re not just raising the standard; we’re redefining it.
        </p>
      </section>

      <section className="bg-[url('/bg/about-2.png')] bg-cover bg-center h-80"></section>

      <section className="flex px-4 container mx-auto">
        <p>
          What sets us apart is the seamless blend of timeless barbershop
          culture with a contemporary twist. At Alpha Omega, you’re not just a
          customer; you’re part of a community. From the moment you step through
          our doors, you’ll experience a welcoming atmosphere, premium service,
          and an attention to detail that takes grooming to the next level. Our
          premium products and techniques ensure that every visit feels like a
          luxurious retreat, while staying true to the authenticity of
          old-school barbering.
        </p>
      </section>

      <section className="flex flex-col gap-8 px-4 mb-40 container mx-auto">
        <h2 className="text-center">Book An Appointment</h2>

        <Button className="w-full max-w-xl mx-auto">BOOK NOW</Button>

        <p>
          We pride ourselves in offering a high quality of service and that
          begins with appointment based bookings. Our online system allows you
          to pick a stylist and time that’s convenient for you, and if you can’t
          make it you can reschedule within 24 hours of your appointment.
        </p>
      </section>
    </main>
  );
}
