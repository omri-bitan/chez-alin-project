"use client";

import * as React from "react";
import {
  getReservations,
  updateReservation,
  type Reservation,
} from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2Icon } from "lucide-react";

const STATUS_STYLES: Record<
  Reservation["status"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pending", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  checked_in: { label: "Checked In", variant: "default" },
  checked_out: { label: "Checked Out", variant: "secondary" },
  refunded: { label: "Refunded", variant: "destructive" },
};

function StatusBadge({ status }: { status: Reservation["status"] }) {
  const style = STATUS_STYLES[status] ?? { label: status, variant: "outline" as const };
  const colorClasses: Record<Reservation["status"], string> = {
    pending: "border-amber-500/50 text-amber-400 bg-amber-500/10",
    confirmed: "border-blue-500/50 text-blue-400 bg-blue-500/10",
    paid: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
    cancelled: "border-red-500/50 text-red-400 bg-red-500/10",
    checked_in: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
    checked_out: "border-blue-500/50 text-blue-400 bg-blue-500/10",
    refunded: "border-red-500/50 text-red-400 bg-red-500/10",
  };

  return (
    <Badge variant={style.variant} className={colorClasses[status]}>
      {style.label}
    </Badge>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReservationsPage() {
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [selected, setSelected] = React.useState<Reservation | null>(null);
  const [updating, setUpdating] = React.useState(false);

  React.useEffect(() => {
    getReservations()
      .then(setReservations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filterStatus === "all"
      ? reservations
      : reservations.filter((r) => r.status === filterStatus);

  async function handleStatusChange(
    id: string,
    status: Reservation["status"]
  ) {
    setUpdating(true);
    try {
      const updated = await updateReservation(id, { status });
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
      if (selected?.id === id) setSelected(updated);
    } catch {
      // silently handle — could add toast
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-destructive">Failed to load reservations</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="text-sm text-muted-foreground">
            {reservations.length} total reservations
          </p>
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No reservations found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell className="font-mono text-xs">
                        #{r.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.guest.first_name} {r.guest.last_name}
                      </TableCell>
                      <TableCell>{formatDate(r.check_in)}</TableCell>
                      <TableCell>{formatDate(r.check_out)}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        EUR {r.total_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.source}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reservation #{selected.id}</DialogTitle>
              <DialogDescription>
                Created {formatDate(selected.created_at)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Guest</p>
                  <p className="font-medium">{selected.guest.first_name} {selected.guest.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.guest.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selected.guest.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Guests</p>
                  <p className="font-medium">{selected.num_guests}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-in</p>
                  <p className="font-medium">{formatDate(selected.check_in)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out</p>
                  <p className="font-medium">
                    {formatDate(selected.check_out)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-amber-500">
                    EUR {selected.total_price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="font-medium">{selected.source}</p>
                </div>
              </div>

              {selected.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1 rounded-lg bg-muted p-3 text-sm">
                    {selected.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    ["pending", "confirmed", "paid", "checked_in", "checked_out", "cancelled", "refunded"] as const
                  ).map((s) => (
                    <Button
                      key={s}
                      variant={selected.status === s ? "default" : "outline"}
                      size="sm"
                      disabled={updating || selected.status === s}
                      onClick={() => handleStatusChange(selected.id, s)}
                      className={
                        selected.status === s
                          ? "bg-amber-500 text-black hover:bg-amber-400"
                          : ""
                      }
                    >
                      {STATUS_STYLES[s].label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
