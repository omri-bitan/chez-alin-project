"use client";

import * as React from "react";
import { getGuests, type Guest } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2Icon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function GuestsPage() {
  const [guests, setGuests] = React.useState<Guest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    getGuests()
      .then(setGuests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
    return (
      fullName.includes(q) ||
      g.email.toLowerCase().includes(q) ||
      (g.phone ?? "").toLowerCase().includes(q) ||
      (g.country ?? "").toLowerCase().includes(q)
    );
  });

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
        <p className="text-destructive">Failed to load guests</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guests</h1>
          <p className="text-sm text-muted-foreground">
            {guests.length} guests total
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <UsersIcon className="h-8 w-8" />
              <p>
                {search ? "No guests match your search" : "No guests yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((guest) => (
                    <TableRow key={guest.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {guest.first_name} {guest.last_name}
                      </TableCell>
                      <TableCell>{guest.email}</TableCell>
                      <TableCell>{guest.phone || "—"}</TableCell>
                      <TableCell>{guest.country || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(guest.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
