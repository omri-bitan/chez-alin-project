from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field
from app.models import ReservationStatus, BlockedDateType


# --- Guest ---
class GuestCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = None
    country: str | None = None


class GuestOut(GuestCreate):
    id: str
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Reservation ---
class ReservationRequest(BaseModel):
    check_in: date
    check_out: date
    num_guests: int = Field(ge=1, le=10)
    guest: GuestCreate
    special_requests: str | None = None


class ReservationOut(BaseModel):
    id: str
    guest_id: str
    check_in: date
    check_out: date
    num_guests: int
    status: ReservationStatus
    nightly_rate: float
    num_nights: int
    subtotal: float
    cleaning_fee: float
    total_price: float
    stripe_session_id: str | None = None
    special_requests: str | None = None
    admin_notes: str | None = None
    source: str
    created_at: datetime
    updated_at: datetime
    guest: GuestOut | None = None

    model_config = {"from_attributes": True}


class ReservationUpdate(BaseModel):
    status: ReservationStatus | None = None
    admin_notes: str | None = None
    num_guests: int | None = None


# --- Availability ---
class AvailabilityQuery(BaseModel):
    check_in: date
    check_out: date
    num_guests: int = 1


class PriceBreakdown(BaseModel):
    check_in: date
    check_out: date
    num_nights: int
    nightly_rate: float
    subtotal: float
    cleaning_fee: float
    total: float
    currency: str
    available: bool
    min_stay: int
    daily_rates: dict[str, float] | None = None


# --- Blocked Dates ---
class BlockedDateCreate(BaseModel):
    date: date
    reason: BlockedDateType = BlockedDateType.owner_block
    note: str | None = None


class BlockedDateOut(BaseModel):
    id: str
    date: date
    reason: BlockedDateType
    note: str | None = None

    model_config = {"from_attributes": True}


# --- Seasonal Rates ---
class SeasonalRateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    start_date: date
    end_date: date
    nightly_rate: float = Field(gt=0)
    min_stay: int = Field(ge=1, default=2)


class SeasonalRateOut(SeasonalRateCreate):
    id: str

    model_config = {"from_attributes": True}


# --- Reviews ---
class ReviewCreate(BaseModel):
    guest_name: str = Field(min_length=1, max_length=200)
    rating: int = Field(ge=1, le=10)
    text: str = Field(min_length=1)
    source: str = "direct"
    stay_date: date | None = None


class ReviewOut(ReviewCreate):
    id: str
    is_published: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Property ---
class PropertyInfo(BaseModel):
    name: str
    currency: str
    timezone: str
    default_nightly_rate: float
    cleaning_fee: float
    min_stay: int
    max_guests: int
    check_in_time: str
    check_out_time: str


class PropertySettingsOut(BaseModel):
    # Property
    name: str
    address: str
    description: str
    currency: str
    timezone: str
    default_nightly_rate: float
    cleaning_fee: float
    min_stay: int
    max_guests: int
    check_in_time: str
    check_out_time: str
    # Contact
    contact_phone: str
    contact_email: str
    contact_website: str
    # iCal
    ical_import_urls: list[str]
    ical_export_url: str
    # Integration statuses (read-only, derived from env)
    stripe_configured: bool
    smtp_configured: bool
    admin_email: str


class PropertySettingsUpdate(BaseModel):
    # All optional — only update what's provided
    name: str | None = None
    address: str | None = None
    description: str | None = None
    currency: str | None = None
    timezone: str | None = None
    default_nightly_rate: float | None = None
    cleaning_fee: float | None = None
    min_stay: int | None = None
    max_guests: int | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    contact_website: str | None = None
    ical_import_urls: list[str] | None = None


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Stats ---
class DashboardStats(BaseModel):
    total_reservations: int
    upcoming_reservations: int
    revenue_this_month: float
    revenue_total: float
    occupancy_rate_this_month: float
    avg_nightly_rate: float
    total_guests: int


# --- Stripe ---
class CheckoutSessionOut(BaseModel):
    checkout_url: str
    session_id: str
