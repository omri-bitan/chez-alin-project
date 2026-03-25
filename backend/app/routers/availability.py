from datetime import date, timedelta
from calendar import monthrange
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_admin
from app.models import Reservation, BlockedDate, ReservationStatus, SeasonalRate
from app.schemas import (
    PriceBreakdown,
    BlockedDateCreate,
    BlockedDateOut,
)
from app.services.pricing_service import PricingService

router = APIRouter()


@router.get("/check", response_model=PriceBreakdown)
async def check_availability(
    check_in: date = Query(...),
    check_out: date = Query(...),
    num_guests: int = Query(1, ge=1),
    session: AsyncSession = Depends(get_db),
):
    """Check availability for a date range and return pricing."""
    if check_out <= check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="check_out must be after check_in",
        )

    # Check overlapping reservations
    overlap_q = select(Reservation).where(
        and_(
            Reservation.check_in < check_out,
            Reservation.check_out > check_in,
            Reservation.status.notin_(
                [ReservationStatus.cancelled, ReservationStatus.refunded]
            ),
        )
    )
    overlap_result = await session.execute(overlap_q)
    has_overlap = overlap_result.scalars().first() is not None

    # Check blocked dates
    blocked_q = select(BlockedDate).where(
        and_(
            BlockedDate.date >= check_in,
            BlockedDate.date < check_out,
        )
    )
    blocked_result = await session.execute(blocked_q)
    has_blocked = blocked_result.scalars().first() is not None

    pricing_service = PricingService(session)
    price = await pricing_service.calculate_price(check_in, check_out)

    # Override availability based on conflicts
    price.available = not (has_overlap or has_blocked)

    return price


@router.get("/calendar")
async def get_calendar(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$", description="YYYY-MM"),
    session: AsyncSession = Depends(get_db),
):
    """Return 2-month calendar data with availability, price, and min_stay per date."""
    year, mon = int(month[:4]), int(month[5:7])

    # Build date range for 2 months
    start_date = date(year, mon, 1)
    if mon == 12:
        end_month_2 = date(year + 1, 2, 1)
    elif mon == 11:
        end_month_2 = date(year + 1, 1, 1)
    else:
        end_month_2 = date(year, mon + 2, 1)
    end_date = end_month_2

    # Get all reservations overlapping the window
    res_q = select(Reservation).where(
        and_(
            Reservation.check_in < end_date,
            Reservation.check_out > start_date,
            Reservation.status.notin_(
                [ReservationStatus.cancelled, ReservationStatus.refunded]
            ),
        )
    )
    res_result = await session.execute(res_q)
    reservations = res_result.scalars().all()

    booked_dates: set[date] = set()
    for r in reservations:
        d = r.check_in
        while d < r.check_out:
            booked_dates.add(d)
            d += timedelta(days=1)

    # Get blocked dates in the window
    blocked_q = select(BlockedDate).where(
        and_(
            BlockedDate.date >= start_date,
            BlockedDate.date < end_date,
        )
    )
    blocked_result = await session.execute(blocked_q)
    blocked_dates: set[date] = {b.date for b in blocked_result.scalars().all()}

    # Get seasonal rates for the window
    rates_q = select(SeasonalRate).where(
        and_(
            SeasonalRate.start_date < end_date,
            SeasonalRate.end_date >= start_date,
        )
    )
    rates_result = await session.execute(rates_q)
    seasonal_rates = rates_result.scalars().all()

    pricing_service = PricingService(session)

    calendar: list[dict] = []
    current = start_date
    while current < end_date:
        is_available = current not in booked_dates and current not in blocked_dates

        rate = await pricing_service.get_rate_for_date(current)

        # Find min_stay from matching seasonal rate or use default
        min_stay = 2  # default
        for sr in seasonal_rates:
            if sr.start_date <= current <= sr.end_date:
                min_stay = sr.min_stay
                break

        calendar.append(
            {
                "date": current.isoformat(),
                "available": is_available,
                "price": rate,
                "min_stay": min_stay,
            }
        )
        current += timedelta(days=1)

    return calendar


@router.get("/blocked", response_model=list[BlockedDateOut])
async def list_blocked_dates(
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """List all blocked dates (admin only)."""
    q = select(BlockedDate).order_by(BlockedDate.date)
    result = await session.execute(q)
    return result.scalars().all()


@router.post("/blocked", response_model=BlockedDateOut, status_code=status.HTTP_201_CREATED)
async def create_blocked_date(
    payload: BlockedDateCreate,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Block a date (admin only)."""
    # Check if date is already blocked
    existing_q = select(BlockedDate).where(BlockedDate.date == payload.date)
    existing_result = await session.execute(existing_q)
    if existing_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Date is already blocked",
        )

    blocked = BlockedDate(
        date=payload.date,
        reason=payload.reason,
        note=payload.note,
    )
    session.add(blocked)
    await session.flush()
    await session.refresh(blocked)
    return blocked


@router.delete("/blocked/{blocked_id}", status_code=status.HTTP_200_OK)
async def delete_blocked_date(
    blocked_id: str,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Unblock a date (admin only)."""
    q = select(BlockedDate).where(BlockedDate.id == blocked_id)
    result = await session.execute(q)
    blocked = result.scalars().first()
    if not blocked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blocked date not found",
        )

    await session.delete(blocked)
    await session.flush()
    return {"detail": "Blocked date removed"}
