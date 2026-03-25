"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicReservation, type ReservationOut } from "@/lib/api-client";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservation_id");

  const [reservation, setReservation] = useState<ReservationOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId) {
      setError("No reservation ID found.");
      setLoading(false);
      return;
    }

    getPublicReservation(reservationId)
      .then((data) => {
        setReservation(data);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load reservation."
        );
      })
      .finally(() => setLoading(false));
  }, [reservationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[oklch(0.13_0_0)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-8 w-8 text-[oklch(0.75_0.15_85)]"
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
          <p className="text-sm font-light text-white/50">
            Loading your reservation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-[oklch(0.13_0_0)] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-10">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-red-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-xl font-light text-white/90 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm font-light text-white/50 mb-8">
              {error || "We couldn't find your reservation."}
            </p>
            <Link href="/">
              <Button
                variant="outline"
                className="border-white/[0.1] text-white/60 hover:bg-white/[0.05] hover:text-white/80 font-light tracking-[0.1em] uppercase text-xs rounded-full px-8 h-11"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    paid: "Paid",
    cancelled: "Cancelled",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <div className="min-h-screen bg-[oklch(0.13_0_0)] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        {/* Success icon */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-400"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extralight tracking-[0.1em] uppercase text-white/90 mb-2">
            Booking Confirmed
          </h1>
          <p className="text-sm font-light text-white/50">
            Thank you for choosing Chez Aline
          </p>
        </div>

        {/* Confirmation card */}
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

          <div className="p-6 sm:p-8">
            {/* Reservation ID & status */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-light tracking-[0.15em] uppercase text-white/40 mb-1">
                  Reservation ID
                </p>
                <p className="text-sm font-mono text-white/70">
                  {reservation.id}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  statusColor[reservation.status] ??
                  "bg-white/10 text-white/60 border-white/20"
                }`}
              >
                {statusLabel[reservation.status] ?? reservation.status}
              </span>
            </div>

            <Separator className="bg-white/[0.06] mb-6" />

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">
              <div>
                <p className="text-xs font-light tracking-[0.1em] uppercase text-white/40 mb-1">
                  Guest
                </p>
                <p className="text-sm font-light text-white/80">
                  {reservation.guest_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-light tracking-[0.1em] uppercase text-white/40 mb-1">
                  Email
                </p>
                <p className="text-sm font-light text-white/80 break-all">
                  {reservation.guest_email}
                </p>
              </div>
              <div>
                <p className="text-xs font-light tracking-[0.1em] uppercase text-white/40 mb-1">
                  Check-in
                </p>
                <p className="text-sm font-light text-white/80">
                  {formatDate(reservation.check_in)}
                </p>
              </div>
              <div>
                <p className="text-xs font-light tracking-[0.1em] uppercase text-white/40 mb-1">
                  Check-out
                </p>
                <p className="text-sm font-light text-white/80">
                  {formatDate(reservation.check_out)}
                </p>
              </div>
              <div>
                <p className="text-xs font-light tracking-[0.1em] uppercase text-white/40 mb-1">
                  Guests
                </p>
                <p className="text-sm font-light text-white/80">
                  {reservation.num_guests}
                </p>
              </div>
              <div>
                <p className="text-xs font-light tracking-[0.1em] uppercase text-white/40 mb-1">
                  Total Paid
                </p>
                <p className="text-sm font-light text-[oklch(0.85_0.15_85)]">
                  {formatCurrency(reservation.total, reservation.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Button
              variant="outline"
              className="border-white/[0.1] text-white/60 hover:bg-white/[0.05] hover:text-white/80 font-light tracking-[0.1em] uppercase text-xs rounded-full px-8 h-11"
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[oklch(0.13_0_0)] flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-[oklch(0.75_0.15_85)]"
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
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
