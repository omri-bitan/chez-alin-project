"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = "ok" | "error" | "not_configured" | "loading";

interface ServiceResult {
  status: ServiceStatus;
  message: string;
}

interface HealthData {
  supabase: ServiceResult;
  stripe: ServiceResult;
  stripe_webhook: ServiceResult;
}

interface Settings {
  property_name: string;
  default_price_per_night: string;
  min_stay_nights: string;
  max_guests: string;
  checkin_time: string;
  checkout_time: string;
  currency: string;
  property_address: string;
  property_description: string;
  airbnb_ical_url: string;
  bookingcom_ical_url: string;
}

const DEFAULT_SETTINGS: Settings = {
  property_name: "",
  default_price_per_night: "150",
  min_stay_nights: "2",
  max_guests: "6",
  checkin_time: "15:00",
  checkout_time: "11:00",
  currency: "EUR",
  property_address: "",
  property_description: "",
  airbnb_ical_url: "",
  bookingcom_ical_url: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    ok: "bg-green-500",
    error: "bg-red-500",
    not_configured: "bg-amber-400",
    loading: "bg-gray-300 animate-pulse",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${colors[status]}`}
    />
  );
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const styles: Record<ServiceStatus, string> = {
    ok: "bg-green-50 text-green-700 border-green-200",
    error: "bg-red-50 text-red-700 border-red-200",
    not_configured: "bg-amber-50 text-amber-700 border-amber-200",
    loading: "bg-gray-50 text-gray-500 border-gray-200",
  };
  const labels: Record<ServiceStatus, string> = {
    ok: "Connected",
    error: "Error",
    not_configured: "Not configured",
    loading: "Checking…",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
  prefix,
}: {
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  prefix?: string;
}) {
  return (
    <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-transparent transition">
      {prefix && (
        <span className="pl-3 pr-1 text-sm text-gray-400 select-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-3 py-2 text-sm text-gray-900 bg-transparent outline-none ${
          readOnly ? "text-gray-400 cursor-default" : ""
        }`}
      />
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
    />
  );
}

function SaveButton({
  saving,
  saved,
  onClick,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
        saved
          ? "bg-green-500 text-white"
          : "bg-amber-500 hover:bg-amber-600 text-white"
      } disabled:opacity-50`}
    >
      {saving ? "Saving…" : saved ? "✓ Saved" : "Save changes"}
    </button>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "property", label: "🏠 Property" },
  { id: "ical", label: "📅 iCal sync" },
  { id: "services", label: "⚙️ Services" },
  { id: "guide", label: "📖 Setup guide" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState("property");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [icalSyncing, setIcalSyncing] = useState(false);
  const [icalResult, setIcalResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load settings
  useEffect(() => {
    apiFetch("/settings/")
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Load health when services tab is active
  useEffect(() => {
    if (tab !== "services") return;
    setHealthLoading(true);
    apiFetch("/settings/health")
      .then(setHealth)
      .catch(() =>
        setHealth({
          supabase: { status: "error", message: "Could not reach backend" },
          stripe: { status: "error", message: "Could not reach backend" },
          stripe_webhook: { status: "error", message: "Could not reach backend" },
        })
      )
      .finally(() => setHealthLoading(false));
  }, [tab]);

  const set = (key: keyof Settings) => (value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = useCallback(
    async (keys: (keyof Settings)[]) => {
      setSaving(true);
      setSaved(false);
      const payload = Object.fromEntries(keys.map((k) => [k, settings[k]]));
      try {
        await apiFetch("/settings/", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [settings]
  );

  const syncIcal = async (source: "airbnb" | "bookingcom") => {
    const urlKey =
      source === "airbnb" ? "airbnb_ical_url" : "bookingcom_ical_url";
    const url = settings[urlKey];
    if (!url) {
      setIcalResult("Paste a URL first.");
      return;
    }
    setIcalSyncing(true);
    setIcalResult(null);
    try {
      const data = await apiFetch(
        `/ical/import?url=${encodeURIComponent(url)}&source=${source}`,
        { method: "POST" }
      );
      setIcalResult(`✓ Imported ${data.imported} blocked dates from ${source}`);
    } catch (e: unknown) {
      setIcalResult(`Error: ${e instanceof Error ? e.message : "sync failed"}`);
    } finally {
      setIcalSyncing(false);
    }
  };

  const exportUrl = `${API}/ical/export`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure your property and connected services
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 underline text-red-500"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Property tab ────────────────────────────────── */}
      {tab === "property" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">
            Property details
          </h2>

          <Field label="Property name" hint="Shown on booking confirmation emails">
            <Input
              value={settings.property_name}
              onChange={set("property_name")}
              placeholder="Chez Aline"
            />
          </Field>

          <Field label="Address" hint="Optional — for guest emails">
            <Input
              value={settings.property_address}
              onChange={set("property_address")}
              placeholder="123 Rue de la Plage, Nice"
            />
          </Field>

          <Field label="Description" hint="Shown on the public site">
            <Textarea
              value={settings.property_description}
              onChange={set("property_description")}
              placeholder="A beautiful holiday home…"
              rows={3}
            />
          </Field>

          <Field label="Default price / night" hint="Used when no seasonal rule matches">
            <Input
              value={settings.default_price_per_night}
              onChange={set("default_price_per_night")}
              type="number"
              prefix="€"
              placeholder="150"
            />
          </Field>

          <Field label="Currency">
            <select
              value={settings.currency}
              onChange={(e) => set("currency")(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-amber-400 transition"
            >
              <option value="EUR">EUR — Euro (€)</option>
              <option value="USD">USD — Dollar ($)</option>
              <option value="GBP">GBP — Pound (£)</option>
              <option value="ILS">ILS — Shekel (₪)</option>
            </select>
          </Field>

          <Field label="Minimum stay" hint="Nights">
            <Input
              value={settings.min_stay_nights}
              onChange={set("min_stay_nights")}
              type="number"
              placeholder="2"
            />
          </Field>

          <Field label="Max guests">
            <Input
              value={settings.max_guests}
              onChange={set("max_guests")}
              type="number"
              placeholder="6"
            />
          </Field>

          <Field label="Check-in time">
            <Input
              value={settings.checkin_time}
              onChange={set("checkin_time")}
              type="time"
            />
          </Field>

          <Field label="Check-out time">
            <Input
              value={settings.checkout_time}
              onChange={set("checkout_time")}
              type="time"
            />
          </Field>

          <div className="flex justify-end mt-6">
            <SaveButton
              saving={saving}
              saved={saved}
              onClick={() =>
                save([
                  "property_name",
                  "property_address",
                  "property_description",
                  "default_price_per_night",
                  "currency",
                  "min_stay_nights",
                  "max_guests",
                  "checkin_time",
                  "checkout_time",
                ])
              }
            />
          </div>
        </div>
      )}

      {/* ── iCal tab ─────────────────────────────────────── */}
      {tab === "ical" && (
        <div className="space-y-6">
          {/* Your export URL */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Your iCal export URL
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Give this URL to Airbnb or Booking.com so they can see your
              confirmed bookings and avoid double-bookings.
            </p>
            <Field label="Export URL" hint="Read-only — copy and paste into Airbnb">
              <div className="flex gap-2">
                <Input value={exportUrl} readOnly />
                <button
                  onClick={() => navigator.clipboard.writeText(exportUrl)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition text-gray-700 whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </Field>
          </div>

          {/* Import from Airbnb */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Import from Airbnb
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Paste your Airbnb iCal link here. Dates blocked on Airbnb will be
              blocked on this site too.{" "}
              <a
                href="https://www.airbnb.com/hosting/calendars"
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 underline"
              >
                Get it from Airbnb →
              </a>
            </p>
            <Field label="Airbnb iCal URL">
              <Input
                value={settings.airbnb_ical_url}
                onChange={set("airbnb_ical_url")}
                placeholder="https://www.airbnb.com/calendar/ical/..."
              />
            </Field>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => save(["airbnb_ical_url"])}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Save URL
              </button>
              <button
                onClick={() => syncIcal("airbnb")}
                disabled={icalSyncing}
                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {icalSyncing ? "Syncing…" : "Sync now"}
              </button>
            </div>
          </div>

          {/* Import from Booking.com */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Import from Booking.com
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Same idea — paste your Booking.com iCal feed URL.{" "}
              <a
                href="https://admin.booking.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 underline"
              >
                Get it from Booking.com →
              </a>
            </p>
            <Field label="Booking.com iCal URL">
              <Input
                value={settings.bookingcom_ical_url}
                onChange={set("bookingcom_ical_url")}
                placeholder="https://ical.booking.com/..."
              />
            </Field>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => save(["bookingcom_ical_url"])}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Save URL
              </button>
              <button
                onClick={() => syncIcal("bookingcom")}
                disabled={icalSyncing}
                className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {icalSyncing ? "Syncing…" : "Sync now"}
              </button>
            </div>
          </div>

          {icalResult && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                icalResult.startsWith("✓")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {icalResult}
            </div>
          )}
        </div>
      )}

      {/* ── Services tab ─────────────────────────────────── */}
      {tab === "services" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-900">
              Services status
            </h2>
            <button
              onClick={() => {
                setHealthLoading(true);
                apiFetch("/settings/health")
                  .then(setHealth)
                  .finally(() => setHealthLoading(false));
              }}
              className="text-sm text-amber-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {healthLoading ? (
            <div className="text-sm text-gray-400 py-8 text-center">
              Checking services…
            </div>
          ) : health ? (
            <div className="space-y-4">
              {/* Supabase */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <StatusDot status={health.supabase.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">
                      Supabase (database)
                    </span>
                    <StatusBadge status={health.supabase.status} />
                  </div>
                  <p className="text-xs text-gray-400">{health.supabase.message}</p>
                  {health.supabase.status !== "ok" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Check <code className="bg-gray-100 px-1 rounded">SUPABASE_URL</code> and{" "}
                      <code className="bg-gray-100 px-1 rounded">SUPABASE_ANON_KEY</code> in your Vercel environment variables.
                    </p>
                  )}
                </div>
              </div>

              {/* Stripe */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <StatusDot status={health.stripe.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">
                      Stripe (payments)
                    </span>
                    <StatusBadge status={health.stripe.status} />
                  </div>
                  <p className="text-xs text-gray-400">{health.stripe.message}</p>
                  {health.stripe.status === "not_configured" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Set <code className="bg-gray-100 px-1 rounded">STRIPE_SECRET_KEY</code> in your environment variables.{" "}
                      <a
                        href="https://dashboard.stripe.com/apikeys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-600 underline"
                      >
                        Get keys →
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Stripe webhook */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <StatusDot status={health.stripe_webhook.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">
                      Stripe webhook secret
                    </span>
                    <StatusBadge status={health.stripe_webhook.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {health.stripe_webhook.message}
                  </p>
                  {health.stripe_webhook.status === "not_configured" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Set <code className="bg-gray-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code>.{" "}
                      <a
                        href="https://dashboard.stripe.com/webhooks"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-600 underline"
                      >
                        Create webhook →
                      </a>{" "}
                      Point it to <code className="bg-gray-100 px-1 rounded">/webhook/stripe</code>
                    </p>
                  )}
                </div>
              </div>

              {/* Backend itself */}
              <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                <StatusDot status="ok" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900">
                      Backend API
                    </span>
                    <StatusBadge status="ok" />
                  </div>
                  <p className="text-xs text-gray-400">{API}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Setup guide tab ──────────────────────────────── */}
      {tab === "guide" && (
        <div className="space-y-6">
          {[
            {
              step: "1",
              title: "Run the database migration",
              color: "bg-purple-50 border-purple-100",
              numColor: "bg-purple-500",
              body: (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Go to your{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 underline"
                    >
                      Supabase dashboard
                    </a>{" "}
                    → SQL Editor → paste the contents of{" "}
                    <code className="bg-gray-100 px-1 rounded text-xs">
                      supabase/migrations/001_init.sql
                    </code>{" "}
                    → click Run.
                  </p>
                  <p className="text-sm text-gray-600">
                    This creates all your tables: reservations, guests,
                    pricing_rules, reviews, blocked_dates, settings.
                  </p>
                </>
              ),
            },
            {
              step: "2",
              title: "Set environment variables",
              color: "bg-amber-50 border-amber-100",
              numColor: "bg-amber-500",
              body: (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    In your Vercel project → Settings → Environment Variables,
                    add these:
                  </p>
                  <div className="space-y-1.5">
                    {[
                      ["SUPABASE_URL", "Your Supabase project URL", true],
                      ["SUPABASE_ANON_KEY", "Your Supabase anon key", true],
                      ["SECRET_KEY", "Any long random string for JWT signing", true],
                      ["ADMIN_EMAIL", "Your login email for the dashboard", true],
                      ["ADMIN_PASSWORD", "Your admin password", true],
                      ["STRIPE_SECRET_KEY", "From stripe.com/dashboard → API keys", false],
                      ["STRIPE_PUBLISHABLE_KEY", "From stripe.com/dashboard → API keys", false],
                      ["STRIPE_WEBHOOK_SECRET", "From Stripe → Webhooks → your endpoint", false],
                      ["FRONTEND_URL", "The URL of your deployed frontend", true],
                    ].map(([key, desc, required]) => (
                      <div key={key as string} className="flex items-start gap-2">
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-800 whitespace-nowrap">
                          {key}
                        </code>
                        <span className="text-xs text-gray-500">{desc as string}</span>
                        {required ? (
                          <span className="text-xs text-red-500 ml-auto whitespace-nowrap">required</span>
                        ) : (
                          <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">optional</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ),
            },
            {
              step: "3",
              title: "Set up Stripe (optional but recommended)",
              color: "bg-blue-50 border-blue-100",
              numColor: "bg-blue-500",
              body: (
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>
                    Create an account at{" "}
                    <a
                      href="https://stripe.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 underline"
                    >
                      stripe.com
                    </a>
                  </li>
                  <li>
                    Go to Developers → API keys → copy Secret key and
                    Publishable key
                  </li>
                  <li>
                    Go to Developers → Webhooks → Add endpoint → paste your
                    backend URL + <code className="bg-gray-100 px-1 rounded">/webhook/stripe</code>
                  </li>
                  <li>Select event: checkout.session.completed</li>
                  <li>Copy the Signing secret → set as STRIPE_WEBHOOK_SECRET</li>
                </ol>
              ),
            },
            {
              step: "4",
              title: "Connect Airbnb / Booking.com iCal",
              color: "bg-green-50 border-green-100",
              numColor: "bg-green-500",
              body: (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    To prevent double-bookings across platforms:
                  </p>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>
                      On Airbnb: Calendar → Availability → Export calendar →
                      copy the iCal URL
                    </li>
                    <li>Paste it in the iCal Sync tab above → Sync now</li>
                    <li>
                      Give Airbnb your export URL (shown in iCal Sync tab) so
                      they can import your bookings
                    </li>
                    <li>Repeat for Booking.com</li>
                  </ol>
                </>
              ),
            },
          ].map(({ step, title, color, numColor, body }) => (
            <div
              key={step}
              className={`rounded-2xl border p-6 ${color}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`w-7 h-7 rounded-full ${numColor} text-white text-xs font-semibold flex items-center justify-center`}
                >
                  {step}
                </span>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              </div>
              {body}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
