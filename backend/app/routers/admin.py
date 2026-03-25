import csv
import io
from datetime import date, datetime
from calendar import monthrange
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.auth import create_access_token, get_current_admin
from app.config import get_settings
from app.models import Reservation, Guest, ReservationStatus
from app.schemas import LoginRequest, TokenOut, DashboardStats

router = APIRouter()


@router.post("/login", response_model=TokenOut)
async def admin_login(payload: LoginRequest):
    """Authenticate admin and return JWT token."""
    settings = get_settings()
    if (
        payload.email != settings.admin_email
        or payload.password != settings.admin_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(data={"sub": settings.admin_email})
    return TokenOut(access_token=token)


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Return dashboard statistics (admin only)."""
    today = date.today()

    # Total reservations (excluding cancelled/refunded)
    total_q = select(func.count(Reservation.id)).where(
        Reservation.status.notin_(
            [ReservationStatus.cancelled, ReservationStatus.refunded]
        )
    )
    total_result = await session.execute(total_q)
    total_reservations = total_result.scalar() or 0

    # Upcoming reservations
    upcoming_q = select(func.count(Reservation.id)).where(
        and_(
            Reservation.check_in >= today,
            Reservation.status.notin_(
                [ReservationStatus.cancelled, ReservationStatus.refunded]
            ),
        )
    )
    upcoming_result = await session.execute(upcoming_q)
    upcoming_reservations = upcoming_result.scalar() or 0

    # Revenue this month
    month_start = today.replace(day=1)
    _, last_day = monthrange(today.year, today.month)
    month_end = today.replace(day=last_day)

    revenue_month_q = select(func.coalesce(func.sum(Reservation.total_price), 0.0)).where(
        and_(
            Reservation.check_in >= month_start,
            Reservation.check_in <= month_end,
            Reservation.status.in_(
                [ReservationStatus.confirmed, ReservationStatus.paid,
                 ReservationStatus.checked_in, ReservationStatus.checked_out]
            ),
        )
    )
    revenue_month_result = await session.execute(revenue_month_q)
    revenue_this_month = float(revenue_month_result.scalar() or 0)

    # Total revenue
    revenue_total_q = select(func.coalesce(func.sum(Reservation.total_price), 0.0)).where(
        Reservation.status.in_(
            [ReservationStatus.confirmed, ReservationStatus.paid,
             ReservationStatus.checked_in, ReservationStatus.checked_out]
        )
    )
    revenue_total_result = await session.execute(revenue_total_q)
    revenue_total = float(revenue_total_result.scalar() or 0)

    # Occupancy rate this month (booked nights / total nights in month)
    nights_q = select(func.coalesce(func.sum(Reservation.num_nights), 0)).where(
        and_(
            Reservation.check_in >= month_start,
            Reservation.check_in <= month_end,
            Reservation.status.notin_(
                [ReservationStatus.cancelled, ReservationStatus.refunded]
            ),
        )
    )
    nights_result = await session.execute(nights_q)
    booked_nights = int(nights_result.scalar() or 0)
    days_in_month = last_day
    occupancy_rate = round((booked_nights / days_in_month) * 100, 1) if days_in_month else 0

    # Average nightly rate
    avg_rate_q = select(func.coalesce(func.avg(Reservation.nightly_rate), 0.0)).where(
        Reservation.status.notin_(
            [ReservationStatus.cancelled, ReservationStatus.refunded]
        )
    )
    avg_rate_result = await session.execute(avg_rate_q)
    avg_nightly_rate = round(float(avg_rate_result.scalar() or 0), 2)

    # Total unique guests
    guests_q = select(func.count(func.distinct(Reservation.guest_id))).where(
        Reservation.status.notin_(
            [ReservationStatus.cancelled, ReservationStatus.refunded]
        )
    )
    guests_result = await session.execute(guests_q)
    total_guests = guests_result.scalar() or 0

    return DashboardStats(
        total_reservations=total_reservations,
        upcoming_reservations=upcoming_reservations,
        revenue_this_month=revenue_this_month,
        revenue_total=revenue_total,
        occupancy_rate_this_month=occupancy_rate,
        avg_nightly_rate=avg_nightly_rate,
        total_guests=total_guests,
    )


@router.get("/export/csv")
async def export_csv(
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Export all reservations as CSV (admin only)."""
    q = (
        select(Reservation)
        .options(selectinload(Reservation.guest))
        .order_by(Reservation.check_in.desc())
    )
    result = await session.execute(q)
    reservations = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "id", "guest_name", "guest_email", "guest_phone",
        "check_in", "check_out", "num_guests", "num_nights",
        "nightly_rate", "subtotal", "cleaning_fee", "total_price",
        "status", "source", "special_requests", "admin_notes",
        "stripe_payment_intent", "created_at",
    ])

    for r in reservations:
        guest_name = f"{r.guest.first_name} {r.guest.last_name}" if r.guest else ""
        guest_email = r.guest.email if r.guest else ""
        guest_phone = r.guest.phone or "" if r.guest else ""

        writer.writerow([
            r.id, guest_name, guest_email, guest_phone,
            r.check_in.isoformat(), r.check_out.isoformat(),
            r.num_guests, r.num_nights,
            r.nightly_rate, r.subtotal, r.cleaning_fee, r.total_price,
            r.status.value, r.source, r.special_requests or "", r.admin_notes or "",
            r.stripe_payment_intent or "", r.created_at.isoformat(),
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=reservations-{date.today().isoformat()}.csv",
        },
    )
