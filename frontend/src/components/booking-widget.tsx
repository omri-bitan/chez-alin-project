"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  checkAvailability,
  type PriceBreakdown,
} from "@/lib/api-client";
import { property } from "@/lib/property-data";
import { BookingForm } from "@/components/booking-form";

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getDayAfterTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

type WidgetStep = "search" | "pricing" | "form";

export function BookingWidget() {
  const [checkIn, setCheckIn] = useState(getTomorrow);
  const [checkOut, setCheckOut] = useState(getDayAfterTomorrow);
  const [numGuests, setNumGuests] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [step, setStep] = useState<WidgetStep>("search");

  async function handleCheckAvailability() {
    setError(null);
    setPricing(null);

    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      setError("Check-out must be after check-in.");
      return;
    }

    if (new Date(checkIn) < new Date(new Date().toISOString().split("T")[0])) {
      setError("Check-in date cannot be in the past.");
      return;
    }

    setLoading(true);
    try {
      const result = await checkAvailability(checkIn, checkOut, numGuests);
      if (result.available) {
        setPricing(result);
        setStep("pricing");
      } else {
        setError(
          "Unfortunately, those dates are not available. Please try different dates."
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleBackToSearch() {
    setStep("search");
    setPricing(null);
    setError(null);
  }

  if (step === "form" && pricing) {
    return (
      <section id="booking" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <BookingForm
            checkIn={checkIn}
            checkOut={checkOut}
            numGuests={numGuests}
            pricing={pricing}
            onBack={() => setStep("pricing")}
          />
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section heading */}
        <div className="flex flex-col items-center mb-16">
          <span className="text-xs font-light tracking-[0.4em] uppercase text-[oklch(0.75_0.15_85)] mb-4">
            Reserve
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-[0.15em] uppercase text-white/90 mb-6">
            Book Your Stay
          </h2>
          <Separator className="w-16 bg-[oklch(0.75_0.15_85/0.4)]" />
        </div>

        {/* Booking card */}
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
          {/* Subtle top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.75_0.15_85/0.4)] to-transparent" />

          <div className="p-6 sm:p-10">
            {step === "search" && (
              <>
                {/* Date & guest inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="check-in"
                      className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
                    >
                      Check-in
                    </Label>
                    <Input
                      id="check-in"
                      type="date"
                      value={checkIn}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setCheckIn(e.target.value);
                        if (
                          e.target.value &&
                          checkOut &&
                          new Date(e.target.value) >= new Date(checkOut)
                        ) {
                          const next = new Date(e.target.value);
                          next.setDate(next.getDate() + 1);
                          setCheckOut(next.toISOString().split("T")[0]);
                        }
                      }}
                      className="h-12 bg-white/[0.04] border-white/[0.08] text-white/90 rounded-xl focus-visible:border-[oklch(0.75_0.15_85/0.5)] focus-visible:ring-[oklch(0.75_0.15_85/0.15)] [color-scheme:dark]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="check-out"
                      className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
                    >
                      Check-out
                    </Label>
                    <Input
                      id="check-out"
                      type="date"
                      value={checkOut}
                      min={
                        checkIn
                          ? (() => {
                              const d = new Date(checkIn);
                              d.setDate(d.getDate() + 1);
                              return d.toISOString().split("T")[0];
                            })()
                          : new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="h-12 bg-white/[0.04] border-white/[0.08] text-white/90 rounded-xl focus-visible:border-[oklch(0.75_0.15_85/0.5)] focus-visible:ring-[oklch(0.75_0.15_85/0.15)] [color-scheme:dark]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="guests"
                      className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
                    >
                      Guests
                    </Label>
                    <div className="relative">
                      <select
                        id="guests"
                        value={numGuests}
                        onChange={(e) => setNumGuests(Number(e.target.value))}
                        className="h-12 w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-white/90 outline-none transition-colors focus:border-[oklch(0.75_0.15_85/0.5)] focus:ring-3 focus:ring-[oklch(0.75_0.15_85/0.15)] [color-scheme:dark]"
                      >
                        {Array.from({ length: property.guests }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {i === 0 ? "Guest" : "Guests"}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mt-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                    <p className="text-sm text-red-400/90">{error}</p>
                  </div>
                )}

                {/* Check Availability button */}
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleCheckAvailability}
                    disabled={loading}
                    className="bg-[oklch(0.75_0.15_85)] text-[oklch(0.15_0_0)] hover:bg-[oklch(0.82_0.15_85)] font-medium tracking-[0.15em] uppercase text-xs border-none rounded-full px-10 h-12 min-w-[220px] shadow-lg shadow-[oklch(0.75_0.15_85/0.15)] disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Checking...
                      </span>
                    ) : (
                      "Check Availability"
                    )}
                  </Button>
                </div>
              </>
            )}

            {step === "pricing" && pricing && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Dates summary */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
                  <div className="text-center">
                    <p className="text-xs font-light tracking-[0.15em] uppercase text-white/40 mb-1">
                      Check-in
                    </p>
                    <p className="text-base font-light text-white/80">
                      {formatDate(checkIn)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-[oklch(0.75_0.15_85/0.6)]"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-light tracking-[0.15em] uppercase text-white/40 mb-1">
                      Check-out
                    </p>
                    <p className="text-base font-light text-white/80">
                      {formatDate(checkOut)}
                    </p>
                  </div>
                  <Separator
                    orientation="vertical"
                    className="hidden sm:block h-10 bg-white/[0.08]"
                  />
                  <div className="text-center">
                    <p className="text-xs font-light tracking-[0.15em] uppercase text-white/40 mb-1">
                      Guests
                    </p>
                    <p className="text-base font-light text-white/80">
                      {numGuests} {numGuests === 1 ? "Guest" : "Guests"}
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/[0.06] mb-8" />

                {/* Price breakdown */}
                <div className="max-w-sm mx-auto space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-light text-white/50">
                      {formatCurrency(pricing.nightly_rate, pricing.currency)} x{" "}
                      {pricing.num_nights}{" "}
                      {pricing.num_nights === 1 ? "night" : "nights"}
                    </span>
                    <span className="text-sm font-light text-white/70">
                      {formatCurrency(pricing.subtotal, pricing.currency)}
                    </span>
                  </div>

                  {pricing.cleaning_fee > 0 && (
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-light text-white/50">
                        Cleaning fee
                      </span>
                      <span className="text-sm font-light text-white/70">
                        {formatCurrency(
                          pricing.cleaning_fee,
                          pricing.currency
                        )}
                      </span>
                    </div>
                  )}

                  <Separator className="bg-white/[0.06]" />

                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-normal text-white/80">
                      Total
                    </span>
                    <span className="text-2xl font-light text-[oklch(0.85_0.15_85)] tracking-wide">
                      {formatCurrency(pricing.total, pricing.currency)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleBackToSearch}
                    className="border-white/[0.1] text-white/60 hover:bg-white/[0.05] hover:text-white/80 font-light tracking-[0.15em] uppercase text-xs rounded-full px-8 h-11 min-w-[160px]"
                  >
                    Change Dates
                  </Button>
                  <Button
                    onClick={() => setStep("form")}
                    className="bg-[oklch(0.75_0.15_85)] text-[oklch(0.15_0_0)] hover:bg-[oklch(0.82_0.15_85)] font-medium tracking-[0.15em] uppercase text-xs border-none rounded-full px-10 h-12 min-w-[200px] shadow-lg shadow-[oklch(0.75_0.15_85/0.15)] transition-all"
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
