import uuid
from datetime import datetime, date
from sqlalchemy import String, Float, Integer, Boolean, Text, Date, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


def gen_id() -> str:
    return uuid.uuid4().hex[:12]


class ReservationStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    paid = "paid"
    checked_in = "checked_in"
    checked_out = "checked_out"
    cancelled = "cancelled"
    refunded = "refunded"


class BlockedDateType(str, enum.Enum):
    owner_block = "owner_block"
    maintenance = "maintenance"
    ical_sync = "ical_sync"


class Guest(Base):
    __tablename__ = "guests"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reservations: Mapped[list["Reservation"]] = relationship(back_populates="guest")


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    guest_id: Mapped[str] = mapped_column(ForeignKey("guests.id"))
    check_in: Mapped[date] = mapped_column(Date, index=True)
    check_out: Mapped[date] = mapped_column(Date, index=True)
    num_guests: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[ReservationStatus] = mapped_column(
        SAEnum(ReservationStatus), default=ReservationStatus.pending
    )

    nightly_rate: Mapped[float] = mapped_column(Float)
    num_nights: Mapped[int] = mapped_column(Integer)
    subtotal: Mapped[float] = mapped_column(Float)
    cleaning_fee: Mapped[float] = mapped_column(Float, default=0)
    total_price: Mapped[float] = mapped_column(Float)

    stripe_session_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_payment_intent: Mapped[str | None] = mapped_column(String(255), nullable=True)

    special_requests: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="direct")  # direct, booking, airbnb, ical

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    guest: Mapped["Guest"] = relationship(back_populates="reservations")


class BlockedDate(Base):
    __tablename__ = "blocked_dates"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    date: Mapped[date] = mapped_column(Date, unique=True, index=True)
    reason: Mapped[BlockedDateType] = mapped_column(SAEnum(BlockedDateType))
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ical_uid: Mapped[str | None] = mapped_column(String(255), nullable=True)


class SeasonalRate(Base):
    __tablename__ = "seasonal_rates"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    nightly_rate: Mapped[float] = mapped_column(Float)
    min_stay: Mapped[int] = mapped_column(Integer, default=2)


class PropertySettings(Base):
    __tablename__ = "property_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    guest_name: Mapped[str] = mapped_column(String(200))
    rating: Mapped[int] = mapped_column(Integer)  # 1-10
    text: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(50), default="direct")
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    stay_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
