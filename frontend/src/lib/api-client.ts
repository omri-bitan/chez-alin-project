const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

function setToken(token: string): void {
  localStorage.setItem("admin_token", token);
}

function clearToken(): void {
  localStorage.removeItem("admin_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function fetchApi<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Auth ----------

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const data = await fetchApi<LoginResponse>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export function logout(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
}

// ---------- Dashboard ----------

export interface DashboardStats {
  total_reservations: number;
  upcoming_reservations: number;
  revenue_this_month: number;
  revenue_total: number;
  occupancy_rate_this_month: number;
  avg_nightly_rate: number;
  total_guests: number;
}

export async function getDashboard(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>("/api/admin/dashboard");
}

// ---------- Reservations ----------

export interface ReservationGuest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  guest_id: string;
  guest: ReservationGuest;
  check_in: string;
  check_out: string;
  status: "pending" | "confirmed" | "paid" | "cancelled" | "checked_in" | "checked_out" | "refunded";
  nightly_rate: number;
  num_nights: number;
  subtotal: number;
  cleaning_fee: number;
  total_price: number;
  source: string;
  notes: string;
  created_at: string;
  num_guests: number;
}

export async function getReservations(): Promise<Reservation[]> {
  return fetchApi<Reservation[]>("/api/reservations");
}

export async function getReservation(id: string): Promise<Reservation> {
  return fetchApi<Reservation>(`/api/reservations/${id}`);
}

export async function updateReservation(
  id: string,
  data: Partial<Reservation>
): Promise<Reservation> {
  return fetchApi<Reservation>(`/api/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ---------- Calendar ----------

export interface CalendarDay {
  date: string;
  available: boolean;
  price: number;
  min_stay: number;
  has_checkout: boolean;
  has_checkin: boolean;
}

export async function getCalendar(month: string): Promise<CalendarDay[]> {
  return fetchApi<CalendarDay[]>(`/api/availability/calendar?month=${month}`);
}

export async function blockDates(data: {
  date: string;
  reason?: string;
  note?: string;
}): Promise<void> {
  return fetchApi<void>("/api/availability/blocked", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function unblockDates(id: string): Promise<void> {
  return fetchApi<void>(`/api/availability/blocked/${id}`, {
    method: "DELETE",
  });
}

// ---------- Guests ----------

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
  created_at: string;
}

export async function getGuests(): Promise<Guest[]> {
  return fetchApi<Guest[]>("/api/guests");
}

// ---------- Reviews ----------

export interface Review {
  id: string;
  guest_name: string;
  rating: number;
  text: string;
  source: string;
  stay_date: string;
  is_published: boolean;
  created_at: string;
}

export async function getReviews(): Promise<Review[]> {
  return fetchApi<Review[]>("/api/reviews");
}

export async function updateReview(
  id: string,
  data: Partial<Review>
): Promise<Review> {
  return fetchApi<Review>(`/api/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteReview(id: string): Promise<void> {
  return fetchApi<void>(`/api/reviews/${id}`, { method: "DELETE" });
}

// ---------- Pricing / Rates ----------

export interface SeasonalRate {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  nightly_rate: number;
  min_stay: number;
}

export async function getRates(): Promise<SeasonalRate[]> {
  return fetchApi<SeasonalRate[]>("/api/property/rates");
}

export async function createRate(
  data: Omit<SeasonalRate, "id">
): Promise<SeasonalRate> {
  return fetchApi<SeasonalRate>("/api/property/rates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRate(
  id: string,
  data: Partial<SeasonalRate>
): Promise<SeasonalRate> {
  return fetchApi<SeasonalRate>(`/api/property/rates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRate(id: string): Promise<void> {
  return fetchApi<void>(`/api/property/rates/${id}`, { method: "DELETE" });
}

// ---------- Public: Availability ----------

export interface PriceBreakdown {
  available: boolean;
  check_in: string;
  check_out: string;
  num_nights: number;
  nightly_rate: number;
  subtotal: number;
  cleaning_fee: number;
  total: number;
  currency: string;
}

export async function checkAvailability(
  checkIn: string,
  checkOut: string,
  numGuests: number
): Promise<PriceBreakdown> {
  return fetchApi<PriceBreakdown>(
    `/api/availability/check?check_in=${checkIn}&check_out=${checkOut}&num_guests=${numGuests}`
  );
}

// ---------- Public: Booking ----------

export interface GuestInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country?: string;
}

export interface ReservationRequest {
  check_in: string;
  check_out: string;
  num_guests: number;
  guest: GuestInput;
  special_requests?: string;
}

export interface ReservationOut {
  id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  guest_name: string;
  guest_email: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
}

export async function createReservation(
  data: ReservationRequest
): Promise<ReservationOut> {
  return fetchApi<ReservationOut>("/api/reservations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createCheckout(
  reservationId: string
): Promise<{ checkout_url: string; session_id: string }> {
  return fetchApi<{ checkout_url: string; session_id: string }>(
    "/api/payments/create-checkout",
    {
      method: "POST",
      body: JSON.stringify({ reservation_id: reservationId }),
    }
  );
}

export async function getPublicReservation(
  id: string
): Promise<ReservationOut> {
  return fetchApi<ReservationOut>(`/api/reservations/${id}`);
}

// ---------- Settings ----------

export interface PropertySettings {
  // Property
  name: string;
  address: string;
  description: string;
  currency: string;
  timezone: string;
  default_nightly_rate: number;
  cleaning_fee: number;
  min_stay: number;
  max_guests: number;
  check_in_time: string;
  check_out_time: string;
  // Contact
  contact_phone: string;
  contact_email: string;
  contact_website: string;
  // iCal
  ical_import_urls: string[];
  ical_export_url: string;
  // Integration status (read-only)
  stripe_configured: boolean;
  smtp_configured: boolean;
  admin_email: string;
}

export interface PropertySettingsUpdate {
  name?: string;
  address?: string;
  description?: string;
  currency?: string;
  timezone?: string;
  default_nightly_rate?: number;
  cleaning_fee?: number;
  min_stay?: number;
  max_guests?: number;
  check_in_time?: string;
  check_out_time?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_website?: string;
  ical_import_urls?: string[];
}

export async function getSettings(): Promise<PropertySettings> {
  return fetchApi<PropertySettings>("/api/property");
}

export async function updateSettings(
  data: PropertySettingsUpdate
): Promise<PropertySettings> {
  return fetchApi<PropertySettings>("/api/property/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function syncCalendar(): Promise<Record<string, unknown>> {
  return fetchApi<Record<string, unknown>>("/api/ical/import", {
    method: "POST",
  });
}
