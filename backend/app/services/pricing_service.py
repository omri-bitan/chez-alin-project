import calendar as cal_module
import logging
from datetime import date, timedelta

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import BlockedDate, Reservation, ReservationStatus, SeasonalRate
from app.schemas import PriceBreakdown

logger = logging.getLogger(__name__)

# Reservation statuses that occupy dates (not cancelled/refunded/checked_out)
_ACTIVE_STATUSES = (
    ReservationStatus.confirmed,
    ReservationStatus.paid,
    ReservationStatus.checked_in,
)


class PricingService:
    """Handles pricing, availability, and calendar logic for the property."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_rate_for_date(self, d: date) -> float:
        """Get the nightly rate for a specific date.

        Checks seasonal rates first, falls back to the default nightly rate
        from settings.

        Args:
            d: The date to look up.

        Returns:
            The nightly rate as a float.
        """
        stmt = select(SeasonalRate).where(
            and_(
                SeasonalRate.start_date <= d,
                SeasonalRate.end_date >= d,
            )
        )
        result = await self.db.execute(stmt)
        seasonal = result.scalars().first()

        if seasonal:
            return seasonal.nightly_rate

        settings = get_settings()
        return settings.default_nightly_rate

    async def calculate_price(
        self, check_in: date, check_out: date
    ) -> PriceBreakdown:
        """Calculate the total price for a stay.

        Builds a per-night rate breakdown using seasonal rates where applicable,
        falling back to the default nightly rate for uncovered dates.

        Args:
            check_in: Arrival date.
            check_out: Departure date.

        Returns:
            A PriceBreakdown schema with all pricing details.
        """
        settings = get_settings()
        num_nights = (check_out - check_in).days

        # Build daily rates
        daily_rates: dict[str, float] = {}
        for i in range(num_nights):
            night_date = check_in + timedelta(days=i)
            rate = await self.get_rate_for_date(night_date)
            daily_rates[night_date.isoformat()] = rate

        subtotal = sum(daily_rates.values())
        avg_rate = subtotal / num_nights if num_nights > 0 else 0.0
        total = subtotal + settings.cleaning_fee

        available = await self.check_availability(check_in, check_out)
        min_stay = await self.get_min_stay(check_in)

        return PriceBreakdown(
            check_in=check_in,
            check_out=check_out,
            num_nights=num_nights,
            nightly_rate=round(avg_rate, 2),
            subtotal=round(subtotal, 2),
            cleaning_fee=settings.cleaning_fee,
            total=round(total, 2),
            currency=settings.property_currency,
            available=available,
            min_stay=min_stay,
            daily_rates=daily_rates,
        )

    async def check_availability(
        self, check_in: date, check_out: date
    ) -> bool:
        """Check whether all dates in a range are available.

        A date range is unavailable if any overlapping confirmed/paid/checked-in
        reservation exists, or if any date in the range is blocked.

        Args:
            check_in: Arrival date (inclusive).
            check_out: Departure date (exclusive — guest departs this day).

        Returns:
            True if every night in the range is free.
        """
        # Check overlapping reservations.
        # Two stays overlap when one starts before the other ends and vice versa.
        reservation_stmt = select(Reservation.id).where(
            and_(
                Reservation.status.in_(_ACTIVE_STATUSES),
                Reservation.check_in < check_out,
                Reservation.check_out > check_in,
            )
        ).limit(1)
        res = await self.db.execute(reservation_stmt)
        if res.scalars().first() is not None:
            return False

        # Check blocked dates (each blocked row is a single date)
        blocked_stmt = select(BlockedDate.id).where(
            and_(
                BlockedDate.date >= check_in,
                BlockedDate.date < check_out,
            )
        ).limit(1)
        res = await self.db.execute(blocked_stmt)
        if res.scalars().first() is not None:
            return False

        return True

    async def get_min_stay(self, check_in: date) -> int:
        """Get the minimum stay length for a given check-in date.

        If a seasonal rate covers the date and defines a min_stay, use that.
        Otherwise fall back to the global default.

        Args:
            check_in: The prospective arrival date.

        Returns:
            Minimum number of nights.
        """
        stmt = select(SeasonalRate).where(
            and_(
                SeasonalRate.start_date <= check_in,
                SeasonalRate.end_date >= check_in,
            )
        )
        result = await self.db.execute(stmt)
        seasonal = result.scalars().first()

        if seasonal:
            return seasonal.min_stay

        settings = get_settings()
        return settings.min_stay

    async def get_calendar(self, year: int, month: int) -> list[dict]:
        """Build a calendar view for a given month.

        Returns one entry per day with availability, pricing, and stay info.

        Args:
            year: Calendar year.
            month: Calendar month (1-12).

        Returns:
            List of dicts, one per day:
            {date, available, price, min_stay, has_checkout, has_checkin}
        """
        _, days_in_month = cal_module.monthrange(year, month)
        month_start = date(year, month, 1)
        month_end = date(year, month, days_in_month)

        # Pre-fetch all seasonal rates that overlap this month
        rates_stmt = select(SeasonalRate).where(
            and_(
                SeasonalRate.start_date <= month_end,
                SeasonalRate.end_date >= month_start,
            )
        )
        rates_result = await self.db.execute(rates_stmt)
        seasonal_rates = rates_result.scalars().all()

        # Pre-fetch blocked dates in this month
        blocked_stmt = select(BlockedDate.date).where(
            and_(
                BlockedDate.date >= month_start,
                BlockedDate.date <= month_end,
            )
        )
        blocked_result = await self.db.execute(blocked_stmt)
        blocked_dates: set[date] = {row for row in blocked_result.scalars().all()}

        # Pre-fetch active reservations overlapping this month
        res_stmt = select(Reservation).where(
            and_(
                Reservation.status.in_(_ACTIVE_STATUSES),
                Reservation.check_in <= month_end,
                Reservation.check_out >= month_start,
            )
        )
        res_result = await self.db.execute(res_stmt)
        reservations = res_result.scalars().all()

        # Build sets for quick lookup
        occupied_dates: set[date] = set()
        checkin_dates: set[date] = set()
        checkout_dates: set[date] = set()
        for r in reservations:
            checkin_dates.add(r.check_in)
            checkout_dates.add(r.check_out)
            d = r.check_in
            while d < r.check_out:
                occupied_dates.add(d)
                d += timedelta(days=1)

        settings = get_settings()
        calendar_days: list[dict] = []

        for day_num in range(1, days_in_month + 1):
            current_date = date(year, month, day_num)

            # Determine rate from seasonal rates
            rate = settings.default_nightly_rate
            min_stay = settings.min_stay
            for sr in seasonal_rates:
                if sr.start_date <= current_date <= sr.end_date:
                    rate = sr.nightly_rate
                    min_stay = sr.min_stay
                    break

            available = (
                current_date not in occupied_dates
                and current_date not in blocked_dates
            )

            calendar_days.append(
                {
                    "date": current_date.isoformat(),
                    "available": available,
                    "price": rate,
                    "min_stay": min_stay,
                    "has_checkin": current_date in checkin_dates,
                    "has_checkout": current_date in checkout_dates,
                }
            )

        return calendar_days
