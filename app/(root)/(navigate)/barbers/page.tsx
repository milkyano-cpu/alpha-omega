import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col gap-20">
      <section className="flex flex-col gap-8 px-4 mt-40 max-w-2xl container mx-auto">
        <div className="w-full md:w-max self-center">
          <Image
            src={"/assets/barbers-1.png"}
            width={500}
            height={500}
            alt="Barbers 3d"
          />
        </div>

        <p>
          From precision haircuts and classic shaves to beard styling and
          premium treatments, our services are designed to keep you looking
          sharp and feeling confident.
        </p>
      </section>

      <section className="flex flex-col items-center gap-8 px-4 container max-w-2xl mx-auto mb-40">
        <div className="w-full md:w-max flex flex-col items-center gap-4">
          <Image
            src={"/assets/barbers-2.png"}
            width={500}
            height={500}
            alt="The Barber"
          />
          <h4>Anthony C.</h4>

          <p>
            <b>HAIR + BEARD </b>$75.00 AUD
          </p>
          <p>
            <b>HAIRCUT </b>$50.00 AUD
          </p>
        </div>

        <div className="w-full md:w-max flex flex-col items-center gap-4">
          <Image
            src={"/assets/barbers-2.png"}
            width={500}
            height={500}
            alt="The Barber"
          />
          <h4>Anthony C.</h4>

          <p>
            <b>HAIR + BEARD </b>$75.00 AUD
          </p>
          <p>
            <b>HAIRCUT </b>$50.00 AUD
          </p>
        </div>

        <div className="w-full md:w-max flex flex-col items-center gap-4">
          <Image
            src={"/assets/barbers-2.png"}
            width={500}
            height={500}
            alt="The Barber"
          />
          <h4>Anthony C.</h4>

          <p>
            <b>HAIR + BEARD </b>$75.00 AUD
          </p>
          <p>
            <b>HAIRCUT </b>$50.00 AUD
          </p>
        </div>

        <div className="w-full md:w-max flex flex-col items-center gap-4">
          <Image
            src={"/assets/barbers-2.png"}
            width={500}
            height={500}
            alt="The Barber"
          />
          <h4>Anthony C.</h4>

          <p>
            <b>HAIR + BEARD </b>$75.00 AUD
          </p>
          <p>
            <b>HAIRCUT </b>$50.00 AUD
          </p>
        </div>

        <div className="w-full md:w-max flex flex-col items-center gap-4">
          <Image
            src={"/assets/barbers-2.png"}
            width={500}
            height={500}
            alt="The Barber"
          />
          <h4>Anthony C.</h4>

          <p>
            <b>HAIR + BEARD </b>$75.00 AUD
          </p>
          <p>
            <b>HAIRCUT </b>$50.00 AUD
          </p>
        </div>
      </section>
    </main>
  );
}
