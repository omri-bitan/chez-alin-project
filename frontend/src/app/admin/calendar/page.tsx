"use client";

import * as React from "react";
import {
  getCalendar,
  blockDates,
  unblockDates,
  type CalendarDay,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
} from "lucide-react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function dayColor(day: CalendarDay): string {
  if (day.has_checkin || day.has_checkout) {
    return "bg-red-500/15 text-red-400 border border-red-500/30";
  }
  if (day.available) {
    return "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30";
  }
  return "bg-muted text-muted-foreground border border-border";
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);
  const [data, setData] = React.useState<CalendarDay[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [toggling, setToggling] = React.useState<string | null>(null);

  const fetchMonth = React.useCallback(
    async (y: number, m: number) => {
      setLoading(true);
      try {
        const cal = await getCalendar(getMonthKey(y, m));
        setData(cal);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchMonth(year, month);
  }, [year, month, fetchMonth]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  async function toggleDate(day: CalendarDay) {
    if (day.has_checkin || day.has_checkout) return; // can't modify a booked date
    setToggling(day.date);
    try {
      if (day.available) {
        await blockDates({ date: day.date, reason: "manual_block" });
      } else {
        // For unblocking, we use the date as the identifier
        await unblockDates(day.date);
      }
      await fetchMonth(year, month);
    } catch {
      // silently handle
    } finally {
      setToggling(null);
    }
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  // Monday=0 ... Sunday=6
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const dayMap = new Map<number, CalendarDay>();
  if (data) {
    for (const d of data) {
      const dayNum = new Date(d.date).getDate();
      dayMap.set(dayNum, d);
    }
  }

  const cells: (CalendarDay | null)[] = [];
  // Leading blanks
  for (let i = 0; i < startDow; i++) cells.push(null);
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(
      dayMap.get(d) ?? {
        date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        available: true,
        price: 0,
        min_stay: 1,
        has_checkout: false,
        has_checkin: false,
      }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Manage availability and blocked dates
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <CardTitle>
              {MONTH_NAMES[month - 1]} {year}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2Icon className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="mb-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500/30" />
                  Available
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-red-500/30" />
                  Check-in / Check-out
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm bg-muted border border-border" />
                  Unavailable
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-2">
                    {w}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, i) => {
                  if (!cell) {
                    return <div key={`blank-${i}`} />;
                  }
                  const dayNum = new Date(cell.date).getDate();
                  const isToday =
                    cell.date ===
                    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                  const isToggling = toggling === cell.date;

                  const isBooked = cell.has_checkin || cell.has_checkout;

                  return (
                    <button
                      key={cell.date}
                      onClick={() => toggleDate(cell)}
                      disabled={isBooked || isToggling}
                      className={`relative flex flex-col items-center rounded-lg p-1.5 text-xs transition-colors sm:p-2 ${dayColor(cell)} ${
                        isBooked
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      } ${isToday ? "ring-2 ring-amber-500" : ""}`}
                    >
                      {isToggling ? (
                        <Loader2Icon className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <span className="font-medium">{dayNum}</span>
                          {cell.price > 0 && cell.available && (
                            <span className="mt-0.5 text-[10px] opacity-70">
                              EUR {cell.price}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
