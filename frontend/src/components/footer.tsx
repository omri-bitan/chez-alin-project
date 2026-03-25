import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { property } from "@/lib/property-data";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-zinc-950 pt-16 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Gradient amber top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      {/* Mountain silhouette decoration */}
      <div className="absolute bottom-0 left-0 right-0 opacity-[0.03] pointer-events-none">
        <svg
          viewBox="0 0 1440 200"
          fill="currentColor"
          className="w-full text-amber-400"
          preserveAspectRatio="none"
        >
          <path d="M0,200 L0,120 L120,80 L200,100 L280,40 L360,90 L440,20 L520,70 L600,30 L680,60 L720,10 L800,50 L880,25 L960,65 L1040,15 L1120,55 L1200,35 L1280,75 L1360,45 L1440,80 L1440,200 Z" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80 mb-5">
              Quick Links
            </h3>
            <nav className="flex flex-col gap-3">
              {[
                { label: "Gallery", href: "#gallery" },
                { label: "Amenities", href: "#amenities" },
                { label: "Location", href: "#location" },
                { label: "Reviews", href: "#reviews" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-amber-300 hover:translate-x-1 transition-all w-fit"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact & Address */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80 mb-5">
              Contact
            </h3>
            <div className="flex flex-col gap-3 text-sm text-zinc-400">
              <div className="flex items-start gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mt-0.5 text-amber-500/60 shrink-0">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{property.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-amber-500/60 shrink-0">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>info@happyrentals.fr</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-5">
              {[
                {
                  label: "Instagram",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  ),
                },
                {
                  label: "Facebook",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  ),
                },
                {
                  label: "Twitter",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-500 ring-1 ring-white/5 hover:text-amber-400 hover:ring-amber-500/20 hover:scale-110 transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Managed By */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400/80 mb-5">
              Managed By
            </h3>
            <p className="text-sm text-zinc-400 mb-2">
              Happy Rentals Chamonix
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed mb-6">
              Professional vacation rental management in Chamonix-Mont-Blanc. We ensure every guest has an exceptional alpine experience.
            </p>
            <a href={property.bookingUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold w-full sm:w-auto px-6 h-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 mr-1.5">
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
                Book on Booking.com
              </Button>
            </a>
          </div>
        </div>

        <Separator className="bg-white/5 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <p>&copy; {currentYear} {property.name} &mdash; Happy Rentals. All rights reserved.</p>
          <div className="flex items-center gap-1 text-zinc-600">
            <span>Made with</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-3 text-amber-500/50">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span>in Chamonix</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
