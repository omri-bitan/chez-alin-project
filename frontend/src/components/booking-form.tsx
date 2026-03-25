"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  createReservation,
  createCheckout,
  type PriceBreakdown,
} from "@/lib/api-client";

interface BookingFormProps {
  checkIn: string;
  checkOut: string;
  numGuests: number;
  pricing: PriceBreakdown;
  onBack: () => void;
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

export function BookingForm({
  checkIn,
  checkOut,
  numGuests,
  pricing,
  onBack,
}: BookingFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const reservation = await createReservation({
        check_in: checkIn,
        check_out: checkOut,
        num_guests: numGuests,
        guest: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          country: country.trim() || undefined,
        },
        special_requests: specialRequests.trim() || undefined,
      });

      try {
        const checkout = await createCheckout(reservation.id);
        if (checkout.checkout_url) {
          window.location.href = checkout.checkout_url;
          return;
        }
      } catch {
        // Stripe not configured — redirect to confirmation instead
      }

      window.location.href = `/booking/confirmation?reservation_id=${reservation.id}`;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create reservation.";
      setError(message);
      setLoading(false);
    }
  }

  const inputStyles =
    "h-11 bg-white/[0.04] border-white/[0.08] text-white/90 rounded-xl focus-visible:border-[oklch(0.75_0.15_85/0.5)] focus-visible:ring-[oklch(0.75_0.15_85/0.15)] placeholder:text-white/25 [color-scheme:dark]";

  return (
    <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.75_0.15_85/0.4)] to-transparent" />

      <div className="p-6 sm:p-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h3 className="text-lg font-light tracking-wide text-white/90">
              Complete Your Booking
            </h3>
            <p className="text-xs font-light text-white/40 mt-0.5">
              {formatDate(checkIn)} &mdash; {formatDate(checkOut)} &middot;{" "}
              {numGuests} {numGuests === 1 ? "guest" : "guests"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Guest details */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
                >
                  First Name <span className="text-[oklch(0.75_0.15_85)]">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean"
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
                >
                  Last Name <span className="text-[oklch(0.75_0.15_85)]">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont"
                  className={inputStyles}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
              >
                Email <span className="text-[oklch(0.75_0.15_85)]">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@example.com"
                className={inputStyles}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
                >
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className={inputStyles}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="country"
                  className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
                >
                  Country
                </Label>
                <Input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="France"
                  className={inputStyles}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="requests"
                className="text-xs font-light tracking-[0.15em] uppercase text-white/50"
              >
                Special Requests
              </Label>
              <textarea
                id="requests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                placeholder="Late check-in, extra pillows, etc."
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-sm text-white/90 outline-none transition-colors placeholder:text-white/25 focus:border-[oklch(0.75_0.15_85/0.5)] focus:ring-3 focus:ring-[oklch(0.75_0.15_85/0.15)] [color-scheme:dark]"
              />
            </div>
          </div>

          <Separator className="my-8 bg-white/[0.06]" />

          {/* Price summary */}
          <div className="space-y-3 mb-8">
            <h4 className="text-xs font-light tracking-[0.15em] uppercase text-white/50 mb-4">
              Price Summary
            </h4>
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
                  {formatCurrency(pricing.cleaning_fee, pricing.currency)}
                </span>
              </div>
            )}
            <Separator className="bg-white/[0.06]" />
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-base font-normal text-white/80">Total</span>
              <span className="text-xl font-light text-[oklch(0.85_0.15_85)] tracking-wide">
                {formatCurrency(pricing.total, pricing.currency)}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <p className="text-sm text-red-400/90">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[oklch(0.75_0.15_85)] text-[oklch(0.15_0_0)] hover:bg-[oklch(0.82_0.15_85)] font-medium tracking-[0.15em] uppercase text-xs border-none rounded-full h-12 shadow-lg shadow-[oklch(0.75_0.15_85/0.15)] disabled:opacity-50 transition-all"
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
                Processing...
              </span>
            ) : (
              "Confirm & Pay"
            )}
          </Button>

          <p className="mt-4 text-center text-xs font-light text-white/30">
            You will be redirected to Stripe for secure payment.
          </p>
        </form>
      </div>
    </div>
  );
}
