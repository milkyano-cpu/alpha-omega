import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Footer() {
  const navLinks = [
    { label: "Home Page", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Services", href: "/services" },
    { label: "Contact Us", href: "/contact" },
    { label: "Gallery", href: "/gallery" },
    { label: "Barbers", href: "/barbers" },
    { label: "Hiring", href: "/hiring" }
  ];

  const workingHours = [
    { day: "Monday", hours: "Closed" },
    { day: "Tuesday", hours: "Closed" },
    { day: "Wednesday", hours: "10am - 7pm" },
    { day: "Thursday", hours: "10am - 7pm" },
    { day: "Friday", hours: "10am - 7pm" },
    { day: "Saturday", hours: "8am - 5pm" },
    { day: "Sunday", hours: "8am - 5pm" }
  ];

  const locations = [
    ["Oakleigh", "Oakleigh East"],
    ["Oakleigh South", "Huntingdale"],
    ["Mount Waverly", "Notting Hill"],
    ["Glen Waverly", "Mulgrave"],
    ["Springvale", "Springvale South"],
    ["Clarinda", "Dingley Village"],
    ["Bentleigh East", "Chadstone"],
    ["Ashwood", "Burwood"],
    ["Burwood East", "Wheelers Hills"],
    ["Noble Park", "Hughesdale"]
  ];

  return (
    <footer className="bg-[#0A0A0A] text-white text-sm">
      {/* Top Section */}
      {/* <div className="flex flex-col md:flex-row items-center justify-center text-center gap-8 py-10 bg-[#272727]">
        <Button variant={"negative"}>BOOK NOW</Button>
      </div> */}

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 pt-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation */}
        <div>
          <b className="text-white text-base">Navigate</b>
          <div className="grid grid-cols-2 gap-2 text-gray-400 mt-4">
            {navLinks.map((link, index) => (
              <Link key={index} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <b className="text-white text-base">Additional Info & Contact</b>
          <div className="text-gray-400 mt-4 space-y-2">
            <p>Alpha Omega</p>
            <p>+61 0000 000 000</p>
            <p>AlphaOmega@gmail.com</p>
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <b className="text-white text-base">Working Hours</b>
          <div className="text-gray-400 mt-4 space-y-2">
            {workingHours.map((item, index) => (
              <div key={index} className="flex justify-between">
                <p>{item.day}</p>
                <p>{item.hours}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div>
          <b className="text-white text-base">Location</b>
          <div className="text-gray-400 mt-4 space-y-2">
            {locations.map((row, index) => (
              <div key={index} className="flex justify-between">
                <span>{row[0]}</span>
                <span>{row[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="py-8 px-6 flex flex-col container mx-auto">
        <p className="text-gray-400 mb-4">Want to join our Newsletter?</p>
        <div className="flex flex-col items-center gap-4 max-w-md">
          <Input
            className="bg-[#292929] border-none px-4 py-3 w-full text-white"
            type="email"
            placeholder="Enter Email"
          />
          <Button className="bg-[#292929] text-white px-6 py-3 rounded-lg w-full text-lg font-semibold">
            Continue
          </Button>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white py-6 text-center text-white">
        Copyright © 2025 Alphaomega.com - All Rights Reserved.
      </div>
    </footer>
  );
}
