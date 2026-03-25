"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Book", href: "#booking" },
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
  { label: "Amenities", href: "#amenities" },
  { label: "Location", href: "#location" },
  { label: "Reviews", href: "#reviews" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    setMobileOpen(false);
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-zinc-950/80 backdrop-blur-xl backdrop-saturate-150 border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "#hero")}
            className="text-lg font-light tracking-[0.2em] uppercase text-white/90 hover:text-white transition-colors"
          >
            Chez Aline
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-[13px] font-light tracking-[0.12em] uppercase text-white/60 hover:text-[oklch(0.85_0.15_85)] transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Book Now CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("booking");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[oklch(0.75_0.15_85)] text-[oklch(0.15_0_0)] hover:bg-[oklch(0.82_0.15_85)] font-medium tracking-wide text-xs uppercase border-none rounded-full px-5"
            >
              Book Now
            </Button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
              aria-label="Toggle menu"
            >
              <span
                className={`block h-px w-5 bg-white/80 transition-all duration-300 ${
                  mobileOpen ? "rotate-45 translate-y-[3.5px]" : ""
                }`}
              />
              <span
                className={`block h-px w-5 bg-white/80 transition-all duration-300 ${
                  mobileOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ${
          mobileOpen ? "max-h-80 border-t border-white/5" : "max-h-0"
        }`}
      >
        <div className="bg-[oklch(0.13_0_0/0.97)] backdrop-blur-md px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-light tracking-[0.1em] uppercase text-white/60 hover:text-[oklch(0.85_0.15_85)] transition-colors py-1"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
