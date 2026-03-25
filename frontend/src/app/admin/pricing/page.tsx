"use client";

import * as React from "react";
import {
  getRates,
  createRate,
  deleteRate,
  getSettings,
  type SeasonalRate,
  type PropertySettings,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  DollarSignIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PricingPage() {
  const [rates, setRates] = React.useState<SeasonalRate[]>([]);
  const [settings, setSettings] = React.useState<PropertySettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = React.useState(false);
  const [formName, setFormName] = React.useState("");
  const [formStart, setFormStart] = React.useState("");
  const [formEnd, setFormEnd] = React.useState("");
  const [formRate, setFormRate] = React.useState("");
  const [formMinStay, setFormMinStay] = React.useState("1");
  const [saving, setSaving] = React.useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = React.useState<SeasonalRate | null>(
    null
  );
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    Promise.all([getRates(), getSettings()])
      .then(([r, s]) => {
        setRates(r);
        setSettings(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const newRate = await createRate({
        name: formName,
        start_date: formStart,
        end_date: formEnd,
        nightly_rate: parseFloat(formRate),
        min_stay: parseInt(formMinStay, 10),
      });
      setRates((prev) => [...prev, newRate]);
      setShowForm(false);
      setFormName("");
      setFormStart("");
      setFormEnd("");
      setFormRate("");
      setFormMinStay("1");
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRate(deleteTarget.id);
      setRates((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // silently handle
    } finally {
      setDeleting(false);
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
        <p className="text-destructive">Failed to load pricing</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing</h1>
        <p className="text-sm text-muted-foreground">
          Manage rates and seasonal pricing
        </p>
      </div>

      {/* Default Rate */}
      {settings && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                <DollarSignIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <CardTitle>Default Nightly Rate</CardTitle>
                <CardDescription>
                  Applied when no seasonal rate is active
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-500">
              {settings.currency} {settings.default_nightly_rate.toFixed(2)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / night
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seasonal Rates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Seasonal Rates</CardTitle>
            <Button
              size="sm"
              className="bg-amber-500 text-black hover:bg-amber-400"
              onClick={() => setShowForm(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Add Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rates.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-muted-foreground">
              No seasonal rates configured
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Rate / Night</TableHead>
                    <TableHead className="text-center">Min Stay</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">
                        {rate.name}
                      </TableCell>
                      <TableCell>{formatDate(rate.start_date)}</TableCell>
                      <TableCell>{formatDate(rate.end_date)}</TableCell>
                      <TableCell className="text-right font-mono">
                        EUR {rate.nightly_rate.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {rate.min_stay} night{rate.min_stay !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(rate)}
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Rate Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Seasonal Rate</DialogTitle>
            <DialogDescription>
              Set a custom rate for a specific date range
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rate-name">Season Name</Label>
              <Input
                id="rate-name"
                placeholder="e.g. Winter Peak"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate-start">Start Date</Label>
                <Input
                  id="rate-start"
                  type="date"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate-end">End Date</Label>
                <Input
                  id="rate-end"
                  type="date"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate-price">Nightly Rate (EUR)</Label>
                <Input
                  id="rate-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="150.00"
                  value={formRate}
                  onChange={(e) => setFormRate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate-min-stay">Min Stay (nights)</Label>
                <Input
                  id="rate-min-stay"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formMinStay}
                  onChange={(e) => setFormMinStay(e.target.value)}
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 text-black hover:bg-amber-400"
                disabled={saving}
              >
                {saving && <Loader2Icon className="h-4 w-4 animate-spin" />}
                Create Rate
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rate</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the &ldquo;{deleteTarget?.name}
              &rdquo; seasonal rate?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
