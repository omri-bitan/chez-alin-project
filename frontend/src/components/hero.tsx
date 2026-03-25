import Image from "next/image";
import { property } from "@/lib/property-data";
import { HeroButtons } from "./hero-buttons";

export function Hero() {
  return (
    <section id="hero" className="relative h-screen w-full overflow-hidden">
      {/* Background image with Ken Burns */}
      <div className="absolute inset-0 animate-ken-burns">
        <Image
          src={property.images[0].url}
          alt={property.images[0].alt}
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
      </div>

      {/* Static gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.14_0.01_70)] via-transparent to-transparent" />

      {/* Animated color shift overlay */}
      <div className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-[oklch(0.75_0.15_85/0.06)] via-transparent to-[oklch(0.6_0.12_45/0.06)]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        {/* Decorative line */}
        <div className="animate-fade-in-up mb-8 h-px w-20 bg-gradient-to-r from-transparent via-[oklch(0.75_0.15_85)] to-transparent" />

        {/* Property name */}
        <h1 className="animate-fade-in-up-delay-1 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extralight tracking-[0.3em] uppercase text-white mb-4 drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
          Chez Aline
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-2 text-sm sm:text-base font-light tracking-[0.3em] uppercase text-[oklch(0.85_0.15_85)] mb-3">
          {property.subtitle}
        </p>

        {/* Tagline */}
        <p className="animate-fade-in-up-delay-2 text-base sm:text-lg font-light text-white/60 max-w-md mb-10 tracking-wide">
          {property.tagline}
        </p>

        {/* Stats row */}
        <div className="animate-fade-in-up-delay-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12 text-white/70">
          <StatItem label={`${property.guests} Guests`} />
          <StatDot />
          <StatItem label={`${property.bedrooms} Bedroom`} />
          <StatDot />
          <StatItem label={property.size} />
          <StatDot />
          <StatItem label="Mountain Views" />
        </div>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up-delay-4">
          <HeroButtons />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-light">
          Scroll
        </span>
        <svg
          width="16"
          height="24"
          viewBox="0 0 16 24"
          fill="none"
          className="text-white/30"
        >
          <rect
            x="1"
            y="1"
            width="14"
            height="22"
            rx="7"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="8" cy="8" r="2" fill="currentColor" className="animate-pulse" />
        </svg>
      </div>
    </section>
  );
}

function StatItem({ label }: { label: string }) {
  return (
    <span className="text-xs sm:text-sm font-light tracking-[0.15em] uppercase">
      {label}
    </span>
  );
}

function StatDot() {
  return (
    <span className="hidden sm:block h-1 w-1 rounded-full bg-[oklch(0.75_0.15_85)]" />
  );
}
