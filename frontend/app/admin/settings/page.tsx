"use client";

import * as React from "react";
import {
  getSettings,
  updateSettings,
  syncCalendar,
  type PropertySettings,
  type PropertySettingsUpdate,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  HomeIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  RefreshCwIcon,
  SaveIcon,
  ShieldIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Notification banner
// ---------------------------------------------------------------------------

type ToastKind = "success" | "error";

function Notification({
  kind,
  message,
  onDismiss,
}: {
  kind: ToastKind;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
        kind === "success"
          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25"
          : "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"
      }`}
    >
      {kind === "success" ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <XIcon className="h-4 w-4" />
      )}
      {message}
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">
        <XIcon className="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
      Connected
    </Badge>
  ) : (
    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25">
      Not Configured
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<PropertySettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [toast, setToast] = React.useState<{
    kind: ToastKind;
    message: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  // --- Editable form state ---
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [currency, setCurrency] = React.useState("");
  const [timezone, setTimezone] = React.useState("");
  const [defaultRate, setDefaultRate] = React.useState(0);
  const [cleaningFee, setCleaningFee] = React.useState(0);
  const [minStay, setMinStay] = React.useState(1);
  const [maxGuests, setMaxGuests] = React.useState(1);
  const [checkInTime, setCheckInTime] = React.useState("");
  const [checkOutTime, setCheckOutTime] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactWebsite, setContactWebsite] = React.useState("");
  const [icalImportUrls, setIcalImportUrls] = React.useState<string[]>([]);
  const [newIcalUrl, setNewIcalUrl] = React.useState("");

  // --- Load settings ---
  const loadSettings = React.useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      // Populate form fields
      setName(data.name ?? "");
      setAddress(data.address ?? "");
      setDescription(data.description ?? "");
      setCurrency(data.currency ?? "");
      setTimezone(data.timezone ?? "");
      setDefaultRate(data.default_nightly_rate ?? 0);
      setCleaningFee(data.cleaning_fee ?? 0);
      setMinStay(data.min_stay ?? 1);
      setMaxGuests(data.max_guests ?? 1);
      setCheckInTime(data.check_in_time ?? "");
      setCheckOutTime(data.check_out_time ?? "");
      setContactPhone(data.contact_phone ?? "");
      setContactEmail(data.contact_email ?? "");
      setContactWebsite(data.contact_website ?? "");
      setIcalImportUrls(data.ical_import_urls ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // --- Toast auto-dismiss ---
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- Save handler ---
  async function handleSave(fields: PropertySettingsUpdate) {
    setSaving(true);
    try {
      const updated = await updateSettings(fields);
      setSettings(updated);
      setToast({ kind: "success", message: "Settings saved" });
    } catch (err) {
      setToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  function saveProperty() {
    handleSave({
      name,
      address,
      description,
      currency,
      timezone,
      default_nightly_rate: defaultRate,
      cleaning_fee: cleaningFee,
      min_stay: minStay,
      max_guests: maxGuests,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
    });
  }

  function saveContact() {
    handleSave({
      contact_phone: contactPhone,
      contact_email: contactEmail,
      contact_website: contactWebsite,
    });
  }

  function saveIcalFeeds() {
    handleSave({ ical_import_urls: icalImportUrls });
  }

  // --- iCal helpers ---
  function addIcalUrl() {
    const trimmed = newIcalUrl.trim();
    if (!trimmed) return;
    setIcalImportUrls((prev) => [...prev, trimmed]);
    setNewIcalUrl("");
  }

  function removeIcalUrl(index: number) {
    setIcalImportUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await syncCalendar();
      setToast({ kind: "success", message: "Calendar synced" });
    } catch (err) {
      setToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Sync failed",
      });
    } finally {
      setSyncing(false);
    }
  }

  function copyExportUrl() {
    if (!settings?.ical_export_url) return;
    navigator.clipboard.writeText(settings.ical_export_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- Loading / Error states ---
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
        <p className="text-destructive">Failed to load settings</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => { setError(null); setLoading(true); loadSettings(); }}>
          Retry
        </Button>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Notification
          kind={toast.kind}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Property configuration, integrations, and calendar sync
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="property">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="property">
            <HomeIcon className="h-4 w-4" />
            Property
          </TabsTrigger>
          <TabsTrigger value="contact">
            <PhoneIcon className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <CreditCardIcon className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="admin">
            <ShieldIcon className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        {/* ============================================================= */}
        {/* TAB 1 — Property Details                                      */}
        {/* ============================================================= */}
        <TabsContent value="property">
          <div className="space-y-6">
            {/* Basic info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                    <HomeIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle>Property Details</CardTitle>
                    <CardDescription>
                      Basic information about your property
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Property Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your property..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      placeholder="EUR"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Europe/Paris"
                    />
                  </div>
                </div>

                <Separator />

                {/* Rates */}
                <h3 className="text-sm font-medium text-muted-foreground">
                  Rates
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultRate">
                      Default Nightly Rate ({currency || "EUR"})
                    </Label>
                    <Input
                      id="defaultRate"
                      type="number"
                      min={0}
                      step={0.01}
                      value={defaultRate}
                      onChange={(e) =>
                        setDefaultRate(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cleaningFee">
                      Cleaning Fee ({currency || "EUR"})
                    </Label>
                    <Input
                      id="cleaningFee"
                      type="number"
                      min={0}
                      step={0.01}
                      value={cleaningFee}
                      onChange={(e) =>
                        setCleaningFee(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Rules */}
                <h3 className="text-sm font-medium text-muted-foreground">
                  Rules
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStay">Min Stay (nights)</Label>
                    <Input
                      id="minStay"
                      type="number"
                      min={1}
                      value={minStay}
                      onChange={(e) =>
                        setMinStay(parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxGuests">Max Guests</Label>
                    <Input
                      id="maxGuests"
                      type="number"
                      min={1}
                      value={maxGuests}
                      onChange={(e) =>
                        setMaxGuests(parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime">Check-in Time</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutTime">Check-out Time</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveProperty} disabled={saving}>
                    {saving ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <SaveIcon className="h-4 w-4" />
                    )}
                    Save Property
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB 2 — Contact                                               */}
        {/* ============================================================= */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                  <PhoneIcon className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    How guests can reach you
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="host@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactWebsite">Website</Label>
                <Input
                  id="contactWebsite"
                  type="url"
                  value={contactWebsite}
                  onChange={(e) => setContactWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={saveContact} disabled={saving}>
                  {saving ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="h-4 w-4" />
                  )}
                  Save Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB 3 — Integrations                                          */}
        {/* ============================================================= */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Stripe */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                      <CreditCardIcon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle>Stripe Payments</CardTitle>
                      <CardDescription>
                        Accept online payments from guests
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge connected={settings.stripe_configured} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Configure Stripe keys in Vercel environment variables
                  (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY).
                </p>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${API_URL}/api/payments/webhook`}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${API_URL}/api/payments/webhook`
                        );
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* iCal */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                    <CalendarIcon className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle>iCal Calendar Sync</CardTitle>
                    <CardDescription>
                      Import from OTAs and export your availability
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Export */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Export Feed URL</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Share this URL with Airbnb, Booking.com, or any platform
                    that supports iCal import.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={settings.ical_export_url || "Not available"}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyExportUrl}
                      disabled={!settings.ical_export_url}
                    >
                      {copied ? (
                        <CheckIcon className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Import Feeds */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Import Feeds</h3>
                  {icalImportUrls.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No iCal import feeds configured
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {icalImportUrls.map((url, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm"
                        >
                          <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
                            {url}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeIcalUrl(i)}
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="https://www.airbnb.com/calendar/ical/..."
                      value={newIcalUrl}
                      onChange={(e) => setNewIcalUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addIcalUrl();
                      }}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={addIcalUrl}
                      disabled={!newIcalUrl.trim()}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={handleSync}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCwIcon className="h-4 w-4" />
                    )}
                    Sync Now
                  </Button>
                  <Button onClick={saveIcalFeeds} disabled={saving}>
                    {saving ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <SaveIcon className="h-4 w-4" />
                    )}
                    Save Feeds
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email / SMTP */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                      <MailIcon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <CardTitle>Email / SMTP</CardTitle>
                      <CardDescription>
                        Transactional email for confirmations and notifications
                      </CardDescription>
                    </div>
                  </div>
                  <StatusBadge connected={settings.smtp_configured} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configure SMTP credentials in Vercel environment variables
                  (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB 4 — Admin                                                 */}
        {/* ============================================================= */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                  <ShieldIcon className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle>Admin Account</CardTitle>
                  <CardDescription>
                    Account and authentication settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Admin Email</Label>
                <p className="text-sm font-medium">
                  {settings.admin_email || "Not set"}
                </p>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Admin credentials are managed via environment variables
                (ADMIN_EMAIL, ADMIN_PASSWORD_HASH). Update them in your Vercel
                project settings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
