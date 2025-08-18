import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function Footer() {
  const navLinks = [
    { label: "Home Page", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Our Story", href: "/about/our-story" },
    { label: "Hiring", href: "/careers" },
    { label: "Our Ethos", href: "/about/our-ethos" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Contact Us", href: "/contacts" },
    { label: "Barbers", href: "/barbers" },
  ];

  const workingHours = [
    { day: "Monday", hours: "10:00-14:00 / 17:00-21:00" },
    { day: "Tuesday", hours: "Closed" },
    { day: "Wednesday", hours: "10:00-14:00 / 17:00-21:00" },
    { day: "Thursday", hours: "10:00-14:00 / 17:00-21:00" },
    { day: "Friday", hours: "10:00-14:00 / 17:00-21:00" },
    { day: "Saturday", hours: "09:00-19:00" },
    { day: "Sunday", hours: "10:00-15:00" },
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
    ["Noble Park", "Hughesdale"],
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
          <div className="grid grid-cols-2 gap-2 text-white mt-4">
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
          <div className="text-white mt-4 space-y-2">
            <p>Alpha Omega</p>
            <p>+61 03 9012 5480</p>
            <p>alpha.omega.mens.grooming@gmail.com</p>
            <a href="https://instagram.com/alpha.omega_mens.grooming">
              IG@alpha.omega_mens.grooming
            </a>
          </div>
        </div>

        {/* Working Hours */}
        <div>
          <b className="text-white text-base">Working Hours</b>
          <div className="text-white mt-4 space-y-2">
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
          <div className="text-transparent mt-4 space-y-2">
            <span className="text-white">Prahran</span>
            {locations.map((row, index) => (
              <div key={index} className="flex justify-between">
                <span className="hover:text-white">{row[0]}</span>
                <span className="hover:text-white">{row[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="py-8 px-6 flex flex-col container mx-auto">
        <p className="text-white mb-4">Want to join our Newsletter?</p>
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
