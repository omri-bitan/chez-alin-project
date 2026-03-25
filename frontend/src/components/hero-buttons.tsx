"use client";

import { Button } from "@/components/ui/button";

export function HeroButtons() {
  function handleBooking() {
    const el = document.getElementById("booking");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleExplore() {
    const el = document.getElementById("about");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Button
        size="lg"
        onClick={handleBooking}
        className="bg-[oklch(0.75_0.15_85)] text-[oklch(0.15_0_0)] hover:bg-[oklch(0.82_0.15_85)] font-medium tracking-[0.15em] uppercase text-xs border-none rounded-full px-10 h-12 min-w-[180px] shadow-lg shadow-[oklch(0.75_0.15_85/0.2)]"
      >
        Book Now
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={handleExplore}
        className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white font-light tracking-[0.15em] uppercase text-xs rounded-full px-10 h-12 min-w-[180px] backdrop-blur-sm"
      >
        Explore
      </Button>
    </div>
  );
}
