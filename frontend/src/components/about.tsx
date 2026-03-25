import { property } from "@/lib/property-data";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "./scroll-reveal";

const highlights = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Central Location",
    description:
      "Just 250m from the Chamonix Mont-Blanc station and steps from the ski bus. Restaurants, shops, and nightlife at your doorstep.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3l4 8 5-5 2 14H3L8 3z" />
      </svg>
    ),
    title: "Mountain Views",
    description:
      "Wake up to stunning alpine panoramas. Mont Blanc and the surrounding peaks form your daily backdrop.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Fully Equipped",
    description:
      "Modern kitchen, washing machine, flat-screen TV, free WiFi, and everything you need for a comfortable stay.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 22 16 8" />
        <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
        <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
        <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
        <line x1="20" y1="2" x2="22" y2="4" />
      </svg>
    ),
    title: "Ski Access",
    description:
      "200m to the ski bus stop. Aiguille du Midi, Montenvers, and the best slopes in the Alps are minutes away.",
  },
];

export function About() {
  return (
    <section id="about" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-b from-transparent via-amber-950/5 to-transparent">
      {/* Section heading */}
      <div className="flex flex-col items-center mb-16">
        <span className="text-xs font-light tracking-[0.4em] uppercase text-[oklch(0.75_0.15_85)] mb-4">
          Welcome
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-[0.15em] uppercase text-white/90 mb-6">
          About
        </h2>
        <Separator className="w-16 bg-[oklch(0.75_0.15_85/0.4)]" />
      </div>

      {/* Description */}
      <div className="max-w-3xl mx-auto text-center mb-20">
        <p className="text-lg sm:text-xl font-light leading-relaxed text-white/60 tracking-wide">
          {property.description}
        </p>
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/40">
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {property.address}
          </span>
        </div>
      </div>

      {/* Highlights grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {highlights.map((item, index) => (
          <ScrollReveal key={item.title} delay={index * 150}>
            <div
              className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] hover:ring-1 hover:ring-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
            >
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-[oklch(0.75_0.15_85/0.03)] to-transparent" />

              <div className="relative">
                <div className="text-[oklch(0.75_0.15_85)] mb-5">
                  {item.icon}
                </div>
                <h3 className="text-base font-normal tracking-wide text-white/85 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm font-light leading-relaxed text-white/45">
                  {item.description}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
