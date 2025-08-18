"use client";

import { FAQSection } from "@/components/faq";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleBookNow = () => {
    if (isAuthenticated) {
      router.push("/book/services");
    } else {
      router.push("/login?returnUrl=/book/services");
    }
  };

  return (
    <main className="flex flex-col gap-20">
      <section className="bg-black bg-cover bg-center h-screen flex flex-col justify-center items-center text-center text-white md:pt-20">
        <div className="w-full md:w-max">
          <Image
            src={"/logo/main.png"}
            width={500}
            height={500}
            alt="Alpha Omega Main logo"
          />
        </div>

        <p className="text-center">
          ELEVATE YOUR IMAGE,
          <br />
          ELEVATE YOUR CONFIDENCE,
          <br />
          COME TO ALPHA OMEGA AND
          <br />
          <br />
          EXPERIENCE THE ART OF ELEGANCE 
        </p>

        <Button variant={"negative"} className="mt-8" onClick={handleBookNow}>
          BOOK NOW
        </Button>

        <div className="flex justify-center items-center gap-8 p-8">
          <a
            href="https://www.instagram.com/alpha.omega_mens.grooming"
            target="_blank"
            rel="noopener noreferrer"
            className="justify-center items-center flex"
          >
            <button>
              <svg
                width="35"
                height="35"
                viewBox="0 0 35 35"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.4555 0C12.7153 0 12.1204 0.0207276 10.2586 0.105455C8.40047 0.190546 7.13215 0.484727 6.02236 0.916364C4.8744 1.36218 3.90061 1.95855 2.93046 2.92909C1.95958 3.89927 1.36323 4.87309 0.915972 6.02073C0.483258 7.13091 0.188721 8.39964 0.105088 10.2571C0.0218174 12.1189 0 12.7142 0 17.4545C0 22.1949 0.0210906 22.788 0.105452 24.6498C0.190904 26.508 0.485076 27.7764 0.916336 28.8862C1.3625 30.0342 1.95885 31.008 2.92937 31.9782C3.89915 32.9491 4.87294 33.5469 6.02018 33.9927C7.13069 34.4244 8.39938 34.7185 10.2571 34.8036C12.1189 34.8884 12.7134 34.9091 17.4533 34.9091C22.1939 34.9091 22.7869 34.8884 24.6487 34.8036C26.5068 34.7185 27.7766 34.4244 28.8871 33.9927C30.0347 33.5469 31.0071 32.9491 31.9769 31.9782C32.9477 31.008 33.5441 30.0342 33.9913 28.8865C34.4204 27.7764 34.7149 26.5076 34.8022 24.6502C34.8859 22.7884 34.9077 22.1949 34.9077 17.4545C34.9077 12.7142 34.8859 12.1193 34.8022 10.2575C34.7149 8.39927 34.4204 7.13091 33.9913 6.02109C33.5441 4.87309 32.9477 3.89927 31.9769 2.92909C31.006 1.95818 30.0351 1.36182 28.886 0.916364C27.7733 0.484727 26.5043 0.190546 24.6462 0.105455C22.7844 0.0207276 22.1917 0 17.45 0H17.4555ZM15.8897 3.14545C16.3544 3.14473 16.8729 3.14545 17.4555 3.14545C22.1157 3.14545 22.668 3.16218 24.5083 3.24582C26.2101 3.32364 27.1337 3.608 27.749 3.84691C28.5635 4.16327 29.1442 4.54145 29.7547 5.15236C30.3656 5.76327 30.7438 6.34509 31.0609 7.15964C31.2998 7.77418 31.5845 8.69782 31.6619 10.3996C31.7456 12.2396 31.7638 12.7924 31.7638 17.4505C31.7638 22.1087 31.7456 22.6615 31.6619 24.5015C31.5841 26.2033 31.2998 27.1269 31.0609 27.7415C30.7445 28.556 30.3656 29.136 29.7547 29.7465C29.1438 30.3575 28.5639 30.7356 27.749 31.052C27.1344 31.292 26.2101 31.5756 24.5083 31.6535C22.6684 31.7371 22.1157 31.7553 17.4555 31.7553C12.7949 31.7553 12.2425 31.7371 10.4026 31.6535C8.70083 31.5749 7.77722 31.2905 7.1616 31.0516C6.34708 30.7353 5.76528 30.3571 5.15439 29.7462C4.5435 29.1353 4.16533 28.5549 3.84825 27.74C3.60935 27.1255 3.32463 26.2018 3.24717 24.5C3.16354 22.66 3.14681 22.1073 3.14681 17.4462C3.14681 12.7851 3.16354 12.2353 3.24717 10.3953C3.32499 8.69345 3.60935 7.76982 3.84825 7.15454C4.1646 6.34 4.5435 5.75818 5.15439 5.14727C5.76528 4.53636 6.34708 4.15818 7.1616 3.84109C7.77686 3.60109 8.70083 3.31745 10.4026 3.23927C12.0127 3.16655 12.6367 3.14473 15.8897 3.14109V3.14545ZM26.7723 6.04364C25.616 6.04364 24.6778 6.98073 24.6778 8.13745C24.6778 9.29382 25.616 10.232 26.7723 10.232C27.9286 10.232 28.8668 9.29382 28.8668 8.13745C28.8668 6.98109 27.9286 6.04291 26.7723 6.04291V6.04364ZM17.4555 8.49091C12.5054 8.49091 8.49211 12.5044 8.49211 17.4545C8.49211 22.4047 12.5054 26.4164 17.4555 26.4164C22.4055 26.4164 26.4174 22.4047 26.4174 17.4545C26.4174 12.5044 22.4051 8.49091 17.4551 8.49091H17.4555ZM17.4555 11.6364C20.6685 11.6364 23.2735 14.2411 23.2735 17.4545C23.2735 20.6676 20.6685 23.2727 17.4555 23.2727C14.2421 23.2727 11.6375 20.6676 11.6375 17.4545C11.6375 14.2411 14.2421 11.6364 17.4555 11.6364V11.6364Z"
                  fill="white"
                />
              </svg>
            </button>
          </a>

          <a
            href="https://www.facebook.com/share/16yXf1kBQt/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="justify-center items-center flex"
          >
            <button>
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 0C27.9 0 36 8.1 36 18C36 26.9 29.5 34.2998 21 35.7998L20.8984 35.7188C20.9322 35.7122 20.9662 35.7069 21 35.7002V23H25L25.7998 18H21V14.5C21 13.1 21.5002 12 23.7002 12H26V7.40039C24.7 7.20039 23.3 7 22 7C17.9 7 15 9.5 15 14V18H10.5V23H15V35.7002C15.0335 35.7069 15.0671 35.7123 15.1006 35.7188L15 35.7998C6.50002 34.2998 0 26.9 0 18C0 8.1 8.1 0 18 0Z"
                  fill="white"
                />
              </svg>
            </button>
          </a>

          {/* <a
            href="https://www.tiktok.com/@alpha_omega_prahran?_t=ZS-8yt6eG9hAuH&_r=1"
            target="_blank"
            rel="noopener noreferrer"
            className="justify-center items-center flex"
          >
            <button>
              <svg
                width="30"
                height="32"
                viewBox="0 0 30 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.5328 26.5179C13.2028 26.5179 15.3673 24.6063 15.3673 21.6834V0H21.1652C20.84 3.95446 24.7711 7.77436 29.1064 7.687V13.1389C25.3988 13.1389 22.2461 11.5712 21.1487 10.7012V21.6834C21.1487 26.5179 17.3455 32 10.5328 32C3.72019 32 0 26.5179 0 21.6834C0 14.86 7.22087 10.9027 12.0034 11.8699V17.4231C11.7628 17.338 11.1424 17.2121 10.6139 17.2121C7.92172 17.1129 5.6984 19.2964 5.6984 21.6834C5.6984 24.3534 7.86285 26.5179 10.5328 26.5179Z"
                  fill="white"
                />
              </svg>
            </button>
          </a> */}
        </div>
      </section>

      <section className="flex flex-col gap-8 justify-center items-center px-4 container mx-auto">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/main-1.png"}
            width={500}
            height={500}
            alt="Our Services 3d"
          />
        </div>

        <p className="text-center">
          Explore our full range of grooming services, from precision cuts and
          tailored trims to beard styling and refreshing shaves – each designed
          to elevate your style, enhance your confidence, and redefine your
          look.
          <br /> <br />
          <b>All hair services includes :</b> refreshing hair washing, styling,
          tips for maintenance and style the final result.
          <br /> <br />
          <b>All beard services Includes :</b> razor, styling 
        </p>

        <div className="w-full overflow-x-auto flex justify-center">
          <div className="flex flex-nowrap gap-4 px-4">
            <div className="w-64 flex-shrink-0">
              <Image
                src={"/logo/main.png"}
                width={500}
                height={500}
                alt="Precision haircut service"
                className="rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 bg-black"
              />
            </div>
          </div>
        </div>

        <Button className="rounded-full px-10" onClick={handleBookNow}>
          CHECK OUR SERVICES
        </Button>
        <p className="text-center">
          Enjoy our introductory 10$ discount on our services by pre-booking
          your next appointment in our shop.
        </p>
      </section>

      <section className="flex flex-col items-center bg-[#F8F8F8] py-10 px-4">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/main-2.png"}
            width={500}
            height={500}
            alt="Opening Time 3d"
          />
        </div>

        <div className="flex flex-col gap-6 container mx-auto max-w-2xl mt-6">
          <p className="text-center">
            At Alpha Omega, we value your time and convenience. Check out our
            flexible opening hours designed to fit seamlessly into your
            schedule, whether it’s a quick trim before work or a full grooming
            session on the weekend.
          </p>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-6 font-medium text-gray-900">
                    Day
                  </th>
                  <th className="text-right py-3 px-6 font-medium text-gray-900">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-700">Monday</td>
                  <td className="py-3 px-6 text-right text-gray-900">
                    10:00-14:00 / 17:00-21:00
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-700">Tuesday</td>
                  <td className="py-3 px-6 text-right text-gray-500">Closed</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-700">Wednesday</td>
                  <td className="py-3 px-6 text-right text-gray-900">
                    10:00-14:00 / 17:00-21:00
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-700">Thursday</td>
                  <td className="py-3 px-6 text-right text-gray-900">
                    10:00-14:00 / 17:00-21:00
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-700">Friday</td>
                  <td className="py-3 px-6 text-right text-gray-900">
                    10:00-14:00 / 17:00-21:00
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-700">Saturday</td>
                  <td className="py-3 px-6 text-right text-gray-900">
                    09:00-19:00
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 text-gray-700">Sunday</td>
                  <td className="py-3 px-6 text-right text-gray-900">
                    10:00-15:00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:grid grid-cols-2 gap-8 px-4 md:w-4xl container mx-auto">
        <div className="flex flex-col gap-2">
          <div className="bg-[#D9D9D9] rounded-xl aspect-square w-full flex justify-center items-center">
            <Image
              src={"/assets/ao-pixelate-black.png"}
              width={300}
              height={300}
              alt=""
            />
          </div>
          <h4 className="bg-gray-100 px-4 py-2 rounded-lg inline-block mt-6">
            EXPERT BARBERS
          </h4>
          <div className="flex items-start gap-4">
            <span className="text-6xl font-bold leading-none">A</span>
            {/* <p>
              <b>
                Achieving your grooming goals by offering a personalized,
                stylish look that compliments your individual features.
              </b>
            </p> */}
          </div>
          <p className="mt-4">
            <b>Our expert barbers</b> are ready to give you recommendations
            considering your{" "}
            <b>lifestyle, facial shape, hair type, and hair density</b> in order
            to ensure that you achieve a{" "}
            <b>
              personalized and stylish look that compliments your individual
              features.
            </b>
          </p>
          <p className="mt-4">
            Through <i>consultation</i> we are dedicated to{" "}
            <i>understand your unique preferences</i> and{" "}
            <b>tailor our recommendations to suit your specific needs.</b>{" "}
            Whether you&apos;re seeking a <b>new haircut, beard trim,</b> or
            grooming routine, we&apos;re here to{" "}
            <b>guide you through the process,</b> ensuring that you not only
            look great but also{" "}
            <b>feel confident with your chosen aesthetic.</b>{" "}
            <i>Trust Alpha Omega Team</i> to provide you with{" "}
            <b>
              comprehensive options that align with your style and enhance your
              overall appearance.
            </b>
          </p>

          {/* <div className="mt-6 space-y-0">
            <div className="pb-4 border-b border-gray-300">
              <p className="font-bold">01</p>
              <h5 className="font-bold">Personalized</h5>
              <p>
                Recommendations considering your lifestyle, facial shape, hair
                type, and hair density to ensure a personalized and stylish
                look.
              </p>
            </div>

            <div className="py-4 border-b border-gray-300">
              <p className="font-bold">02</p>
              <h5 className="font-bold">Consultation-Based</h5>
              <p>
                Through consultation we are dedicated to understand your unique
                preferences and tailor recommendations to suit your specific
                needs.
              </p>
            </div>

            <div className="py-4 border-b border-gray-300">
              <p className="font-bold">03</p>
              <h5 className="font-bold">Comprehensive Guidance</h5>
              <p>
                Whether you&apos;re seeking a haircut, beard trim, or a complete
                grooming routine, we&apos;re here to guide you, ensuring you
                look great and feel confident.
              </p>
            </div>
          </div> */}
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
          <h4 className="bg-gray-100 px-4 py-2 rounded-lg inline-block mt-6">
            CREATIVE AND MODERN
          </h4>
          <div className="flex items-start gap-4">
            <Image
              src={"/assets/omega-sign.png"}
              width={80}
              height={80}
              alt=""
            />
            {/* <p>
              <b>
                Opening new boundaries between traditional barbering and modern
                hairdressing.
              </b>
            </p> */}
          </div>
          <p className="mt-4">
            <b>Alpha Omega mens grooming</b> stands as a{" "}
            <b>beacon of innovation</b>,{" "}
            <i>ushering in a new era in mens grooming.</i> With a{" "}
            <b>seamless blend of technical expertise</b> and creative vision, we{" "}
            <b>
              redefine the boundaries of traditional barbering and modern
              hairdressing.
            </b>{" "}
            Our <b>dedication is unwavering to unite</b> the timeless charm of
            the classic barbershop with the refined elegance of{" "}
            <b>today&apos;s salons.</b>
          </p>

          {/* <div className="mt-6 space-y-0">
            <div className="pb-4 border-b border-gray-300">
              <p className="font-bold">01</p>
              <h5 className="font-bold">Innovative</h5>
              <p>
                A beacon of innovation that brings a fresh approach to modern
                men&apos;s grooming.
              </p>
            </div>

            <div className="py-4 border-b border-gray-300">
              <p className="font-bold">02</p>
              <h5 className="font-bold">Creative Expertise</h5>
              <p>
                Seamlessly blending technical expertise with creative vision to
                redefine grooming standards.
              </p>
            </div>

            <div className="py-4 border-b border-gray-300">
              <p className="font-bold">03</p>
              <h5 className="font-bold">Timeless Meets Modern</h5>
              <p>
                Bridging the gap between the timeless charm of classic
                barbershops and the refined elegance of contemporary salons.
              </p>
            </div>
          </div> */}
        </div>

        <p className="col-span-2 text-center">
          elevate your image - elevate your confidence 
        </p>
      </section>

      <section className="flex flex-col items-center gap-8 bg-[#F8F8F8] py-10 px-4">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/main-3.png"}
            width={500}
            height={500}
            alt="What Our Clients Say"
          />
        </div>

        {/* <div className="flex flex-col container md:flex-row gap-4">
          <div className="w-full">
            <Image
              src={"/assets/main-client-1.png"}
              width={500}
              height={500}
              alt="Client Feedback"
            />
          </div>
          <div className="w-full">
            <Image
              src={"/assets/main-client-2.png"}
              width={500}
              height={500}
              alt="Client Feedback"
            />
          </div>
          <div className="w-full">
            <Image
              src={"/assets/main-client-3.png"}
              width={500}
              height={500}
              alt="Client Feedback"
            />
          </div>
          <div className="w-full">
            <Image
              src={"/assets/main-client-4.png"}
              width={500}
              height={500}
              alt="Client Feedback"
            />
          </div>
        </div> */}
      </section>

      <section className="flex flex-col items-center gap-8 px-4 container mx-auto">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/main-4.png"}
            width={500}
            height={500}
            alt="Our Socials"
          />
        </div>

        <div className="flex flex-col md:flex-row justify-evenly items-center w-full md:w-fit md:gap-8">
          <p className="mb-4 md:mb-0">@alpha.omega_mens.grooming</p>
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 0C4.47715 0 0 4.47715 0 10V30C0 35.5228 4.47715 40 10 40H30C35.5228 40 40 35.5228 40 30V10C40 4.47715 35.5228 0 30 0H10ZM10.1 14.5C10.1 12.0699 12.0699 10.1 14.5 10.1H25.5C27.9301 10.1 29.9 12.0699 29.9 14.5V25.5C29.9 27.9301 27.9301 29.9 25.5 29.9H14.5C12.0699 29.9 10.1 27.9301 10.1 25.5V14.5ZM14.5 7.9C10.8549 7.9 7.9 10.8549 7.9 14.5V25.5C7.9 29.1451 10.8549 32.1 14.5 32.1H25.5C29.1451 32.1 32.1 29.1451 32.1 25.5V14.5C32.1 10.8549 29.1451 7.9 25.5 7.9H14.5ZM26.05 12.85C25.4425 12.85 24.95 13.3425 24.95 13.95C24.95 14.5575 25.4425 15.05 26.05 15.05H26.061C26.6685 15.05 27.161 14.5575 27.161 13.95C27.161 13.3425 26.6685 12.85 26.061 12.85H26.05ZM18.5277 17.0233C19.1438 16.7036 19.845 16.5863 20.5316 16.6881C21.232 16.792 21.8804 17.1183 22.381 17.619C22.8817 18.1196 23.208 18.768 23.3119 19.4684C23.4137 20.155 23.2964 20.8562 22.9767 21.4723C22.6571 22.0884 22.1512 22.588 21.5312 22.9001C20.9112 23.2121 20.2086 23.3208 19.5233 23.2105C18.838 23.1002 18.205 22.7767 17.7141 22.2859C17.2233 21.795 16.8998 21.162 16.7895 20.4767C16.6792 19.7914 16.7879 19.0888 17.0999 18.4688C17.412 17.8488 17.9116 17.3429 18.5277 17.0233ZM20.8544 14.5119C19.71 14.3422 18.5413 14.5377 17.5145 15.0705C16.4876 15.6033 15.6549 16.4463 15.1348 17.4797C14.6147 18.513 14.4337 19.684 14.6174 20.8262C14.8012 21.9684 15.3405 23.0235 16.1585 23.8415C16.9765 24.6595 18.0316 25.1988 19.1738 25.3826C20.316 25.5663 21.487 25.3853 22.5203 24.8652C23.5537 24.3451 24.3967 23.5124 24.9295 22.4855C25.4623 21.4587 25.6578 20.29 25.4881 19.1456C25.315 17.9784 24.7711 16.8977 23.9367 16.0633C23.1023 15.2289 22.0216 14.685 20.8544 14.5119Z"
              fill="#292929"
            />
          </svg>
        </div>

        {/* <div className="rounded-xl shadow-xl w-60 md:w-2xl h-96" /> */}

        <p className="mt-10 md:mt-0">OR FIND US AT</p>

        <div className="w-full md:w-max">
          <Image
            src={"/assets/main-5.png"}
            width={500}
            height={500}
            alt="Alpha Omega on the map"
          />
        </div>
      </section>

      <section className="flex flex-col items-center gap-8 bg-[#F8F8F8] py-10 px-4">
        <div className="w-full md:w-max">
          <Image
            src={"/assets/main-6.png"}
            width={500}
            height={500}
            alt="Our Contacts"
          />
        </div>

        <p>OR REACH US THROUGH</p>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex gap-2">
            <svg
              width="29"
              height="28"
              viewBox="0 0 29 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20.8242 0H8.17577C3.94334 0 0.5 3.44334 0.5 7.67583V20.3242C0.5 24.5567 3.94334 28 8.17577 28H20.8242C25.0567 28 28.5 24.5567 28.5 20.3242V7.67583C28.5 3.44334 25.0567 0 20.8242 0ZM26.8465 20.3242C26.8465 23.6449 24.145 26.3465 20.8242 26.3465H8.17577C4.85509 26.3465 2.15353 23.645 2.15353 20.3242V7.67583C2.15353 4.35509 4.85509 1.65353 8.17577 1.65353H20.8242C24.145 1.65353 26.8465 4.35509 26.8465 7.67583V20.3242Z"
                fill="#292929"
              />
              <path
                d="M14.5017 6.32028C10.267 6.32028 6.82188 9.76543 6.82188 14.0001C6.82188 18.2348 10.267 21.6799 14.5017 21.6799C18.7364 21.6799 22.1816 18.2347 22.1816 14C22.1816 9.76537 18.7364 6.32028 14.5017 6.32028ZM14.5017 20.0264C11.1788 20.0264 8.47535 17.323 8.47535 14C8.47535 10.6771 11.1788 7.9737 14.5017 7.9737C17.8247 7.9737 20.5281 10.6772 20.5281 14.0001C20.5281 17.323 17.8247 20.0264 14.5017 20.0264Z"
                fill="#292929"
              />
              <path
                d="M22.6375 3.52757C21.3509 3.52757 20.3042 4.57435 20.3042 5.86092C20.3042 7.1475 21.3509 8.19422 22.6375 8.19422C23.924 8.19422 24.9708 7.14745 24.9708 5.86087C24.9708 4.57429 23.924 3.52757 22.6375 3.52757Z"
                fill="#292929"
              />
            </svg>

            <p>@alpha.omega_mens.grooming</p>
          </div>

          <div className="flex gap-2">
            <svg
              width="31"
              height="26"
              viewBox="0 0 31 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M30.5 9.49941C30.5 4.74711 26.6338 0.880859 21.8814 0.880859H9.11855C4.36625 0.880918 0.5 4.74717 0.5 9.49947C0.5 10.9028 1.6417 12.0445 3.04502 12.0445H5.47432L3.71545 16.0276C3.09389 17.4352 2.77871 18.9292 2.77871 20.468V22.1001C2.77871 23.8571 4.20816 25.2866 5.96522 25.2866H25.0343C26.7914 25.2866 28.2209 23.8571 28.2209 22.1001V20.468C28.2209 18.9291 27.9057 17.4352 27.2841 16.0276L25.5252 12.0445H27.9549C29.3583 12.0444 30.5 10.9028 30.5 9.49941ZM9.11855 2.84586H21.8814C24.6491 2.84586 27.027 4.54467 28.0285 6.95404H22.366C21.8821 6.45312 21.2042 6.1407 20.4543 6.1407H10.5457C9.79443 6.1407 9.11545 6.45436 8.63129 6.95686C8.61242 6.9558 8.59373 6.95398 8.57463 6.95398H2.9716C3.97297 4.54455 6.351 2.84586 9.11855 2.84586ZM3.04502 10.0794C2.72521 10.0794 2.46506 9.81928 2.46506 9.49941C2.46506 9.30389 2.47402 9.11041 2.49066 8.9191H7.88603V9.67748C7.88603 9.89908 7.70568 10.0793 7.48414 10.0793H3.04502V10.0794ZM26.2559 20.4678V22.0999C26.2559 22.7734 25.708 23.3213 25.0344 23.3213H5.96522C5.29174 23.3213 4.74377 22.7734 4.74377 22.0999V20.4678C4.74377 19.2041 5.00258 17.9772 5.51305 16.8212L7.62447 12.0399C8.86455 11.967 9.85115 10.9355 9.85115 9.67754V8.80051C9.85115 8.41748 10.1628 8.10588 10.5457 8.10588H20.4543C20.8373 8.10588 21.1488 8.41748 21.1488 8.80051V9.67754C21.1488 10.9354 22.1352 11.9669 23.3751 12.0399L25.4865 16.8213C25.9971 17.9772 26.2559 19.2041 26.2559 20.4678ZM23.5159 10.0794C23.2943 10.0794 23.114 9.89914 23.114 9.67754V8.91916H28.5094C28.526 9.11047 28.535 9.30394 28.535 9.49953C28.535 9.81934 28.2748 10.0795 27.955 10.0795H23.5159V10.0794Z"
                fill="#292929"
              />
              <path
                d="M12.0675 14.1291C12.6679 14.1291 13.1545 13.6425 13.1545 13.0421C13.1545 12.4418 12.6679 11.9551 12.0675 11.9551C11.4671 11.9551 10.9805 12.4418 10.9805 13.0421C10.9805 13.6425 11.4671 14.1291 12.0675 14.1291Z"
                fill="#292929"
              />
              <path
                d="M15.5011 14.1291C16.1014 14.1291 16.5881 13.6425 16.5881 13.0421C16.5881 12.4418 16.1014 11.9551 15.5011 11.9551C14.9007 11.9551 14.4141 12.4418 14.4141 13.0421C14.4141 13.6425 14.9007 14.1291 15.5011 14.1291Z"
                fill="#292929"
              />
              <path
                d="M18.9308 14.1296C19.5311 14.1296 20.0178 13.6429 20.0178 13.0426C20.0178 12.4422 19.5311 11.9556 18.9308 11.9556C18.3304 11.9556 17.8438 12.4422 17.8438 13.0426C17.8438 13.6429 18.3304 14.1296 18.9308 14.1296Z"
                fill="#292929"
              />
              <path
                d="M12.0675 17.4329C12.6679 17.4329 13.1545 16.9462 13.1545 16.3458C13.1545 15.7455 12.6679 15.2588 12.0675 15.2588C11.4671 15.2588 10.9805 15.7455 10.9805 16.3458C10.9805 16.9462 11.4671 17.4329 12.0675 17.4329Z"
                fill="#292929"
              />
              <path
                d="M15.5011 17.4329C16.1014 17.4329 16.5881 16.9462 16.5881 16.3458C16.5881 15.7455 16.1014 15.2588 15.5011 15.2588C14.9007 15.2588 14.4141 15.7455 14.4141 16.3458C14.4141 16.9462 14.9007 17.4329 15.5011 17.4329Z"
                fill="#292929"
              />
              <path
                d="M18.9308 17.4333C19.5311 17.4333 20.0178 16.9467 20.0178 16.3463C20.0178 15.746 19.5311 15.2593 18.9308 15.2593C18.3304 15.2593 17.8438 15.746 17.8438 16.3463C17.8438 16.9467 18.3304 17.4333 18.9308 17.4333Z"
                fill="#292929"
              />
              <path
                d="M12.0675 20.7371C12.6679 20.7371 13.1545 20.2504 13.1545 19.65C13.1545 19.0497 12.6679 18.563 12.0675 18.563C11.4671 18.563 10.9805 19.0497 10.9805 19.65C10.9805 20.2504 11.4671 20.7371 12.0675 20.7371Z"
                fill="#292929"
              />
              <path
                d="M15.5011 20.7371C16.1014 20.7371 16.5881 20.2504 16.5881 19.65C16.5881 19.0497 16.1014 18.563 15.5011 18.563C14.9007 18.563 14.4141 19.0497 14.4141 19.65C14.4141 20.2504 14.9007 20.7371 15.5011 20.7371Z"
                fill="#292929"
              />
              <path
                d="M18.9308 20.7375C19.5311 20.7375 20.0178 20.2509 20.0178 19.6505C20.0178 19.0502 19.5311 18.5635 18.9308 18.5635C18.3304 18.5635 17.8438 19.0502 17.8438 19.6505C17.8438 20.2509 18.3304 20.7375 18.9308 20.7375Z"
                fill="#292929"
              />
            </svg>

            <p>+61 03 9012 5480</p>
          </div>

          <div className="flex gap-2">
            <svg
              width="29"
              height="22"
              viewBox="0 0 29 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25.4922 0.335938H3.50781C2.71036 0.336806 1.94581 0.653979 1.38193 1.21786C0.818041 1.78175 0.500869 2.5463 0.5 3.34375V18.6562C0.500869 19.4537 0.818041 20.2182 1.38193 20.7821C1.94581 21.346 2.71036 21.6632 3.50781 21.6641H25.4922C26.2896 21.6632 27.0542 21.346 27.6181 20.7821C28.182 20.2182 28.4991 19.4537 28.5 18.6562V3.34375C28.4991 2.5463 28.182 1.78175 27.6181 1.21786C27.0542 0.653979 26.2896 0.336806 25.4922 0.335938ZM26.8594 3.34375V18.6562C26.8594 18.7227 26.8545 18.7891 26.8446 18.8548L18.9576 11L26.8446 3.14523C26.8545 3.21094 26.8594 3.2773 26.8594 3.34375ZM25.4922 1.97656C25.5551 1.97677 25.618 1.98115 25.6803 1.98969L14.5 13.1235L3.31969 1.98969C3.38204 1.98115 3.44488 1.97677 3.50781 1.97656H25.4922ZM2.15539 18.8548C2.1455 18.7891 2.14056 18.7227 2.14062 18.6562V3.34375C2.14056 3.2773 2.1455 3.21094 2.15539 3.14523L10.0424 11L2.15539 18.8548ZM3.50781 20.0234C3.44488 20.0232 3.38204 20.0188 3.31969 20.0103L11.2051 12.1577L13.9214 14.8626C14.0751 15.0155 14.2832 15.1014 14.5 15.1014C14.7168 15.1014 14.9249 15.0155 15.0786 14.8626L17.7949 12.1577L25.6803 20.0103C25.618 20.0188 25.5551 20.0232 25.4922 20.0234H3.50781Z"
                fill="#292929"
              />
            </svg>

            <p>alpha.omega.mens.grooming@gmail.com</p>
          </div>
        </div>
      </section>

      <section className="bg-[url('/bg/main-2.png')] bg-cover bg-center flex flex-col justify-center items-center text-center py-10 -mt-20 px-4">
        <h4>
          DISCOVER <br />
          WHY WE’RE YOUR <br />
          TOP CHOICE.
        </h4>

        <div className="w-full md:w-max">
          <Image
            src={"/assets/main-7.png"}
            width={500}
            height={500}
            alt="Barbershop 3d"
          />
        </div>
      </section>

      <section className="flex flex-col gap-8 px-4 container mx-auto">
        <h3 className="text-center">Frequently Asked Questions</h3>

        <FAQSection />
      </section>

      <section className="flex flex-col items-center gap-8 px-4 mb-40 container mx-auto">
        <h3 className="text-center">Join Our Gallery Of Successful Cuts.</h3>

        <p>
          Experience the real barbershop experience. Ultimate grooming with
          luxury service designed for you. Our team of expert barbers doesn’t
          disappoint!
        </p>

        <Button
          variant={"secondary"}
          className="rounded-3xl"
          onClick={handleBookNow}
        >
          Book appointment
        </Button>

        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-[500px] aspect-square overflow-hidden rounded-4xl shadow-lg">
            <Image
              src="/assets/main-8.png"
              fill
              alt="Gallery of successful haircuts showcase"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
