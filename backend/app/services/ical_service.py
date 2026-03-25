import logging
from datetime import date, timedelta

import httpx
import icalendar
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import (
    BlockedDate,
    BlockedDateType,
    Reservation,
    ReservationStatus,
)

logger = logging.getLogger(__name__)

_EXPORTABLE_STATUSES = (
    ReservationStatus.confirmed,
    ReservationStatus.paid,
    ReservationStatus.checked_in,
)


class ICalService:
    """Handles iCal export and import for channel-manager synchronisation."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def export_ical(self) -> str:
        """Export all active reservations as an iCal calendar string.

        Each confirmed/paid/checked-in reservation becomes a VEVENT with
        DTSTART = check_in, DTEND = check_out.

        Returns:
            The full iCalendar document as a UTF-8 string.
        """
        settings = get_settings()

        cal = icalendar.Calendar()
        cal.add("prodid", f"-//{settings.property_name}//Booking//EN")
        cal.add("version", "2.0")
        cal.add("x-wr-calname", f"{settings.property_name} Reservations")

        stmt = select(Reservation).where(
            Reservation.status.in_(_EXPORTABLE_STATUSES)
        )
        result = await self.db.execute(stmt)
        reservations = result.scalars().all()

        for r in reservations:
            event = icalendar.Event()
            event.add("dtstart", r.check_in)
            event.add("dtend", r.check_out)

            # Build guest name from the relationship if loaded, else use ID
            guest_name = r.guest_id
            if r.guest:
                guest_name = f"{r.guest.first_name} {r.guest.last_name}"

            event.add("summary", f"{settings.property_name} - {guest_name}")
            event.add("uid", f"{r.id}@{settings.property_name.lower().replace(' ', '')}")
            event.add("description", f"Guests: {r.num_guests}, Source: {r.source}")
            cal.add_component(event)

        return cal.to_ical().decode()

    async def import_from_urls(self, urls: list[str]) -> dict:
        """Import external iCal feeds and create BlockedDate entries.

        For each URL the method:
        1. Fetches the iCal feed via HTTP.
        2. Parses VEVENT components.
        3. Removes previously-synced BlockedDate rows from that feed.
        4. Creates new BlockedDate rows (type=ical_sync) for each occupied
           night derived from the event's DTSTART/DTEND.

        Args:
            urls: List of iCal feed URLs (Booking.com, Airbnb, etc.).

        Returns:
            Dict keyed by URL, each value being
            {imported: int, errors: list[str]}.
        """
        results: dict[str, dict] = {}

        async with httpx.AsyncClient(timeout=30.0) as client:
            for url in urls:
                url = url.strip()
                if not url:
                    continue

                feed_result: dict = {"imported": 0, "errors": []}
                results[url] = feed_result

                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                except httpx.HTTPError as exc:
                    msg = f"Failed to fetch feed: {exc}"
                    logger.warning("iCal import error for %s: %s", url, msg)
                    feed_result["errors"].append(msg)
                    continue

                try:
                    cal = icalendar.Calendar.from_ical(resp.content)
                except Exception as exc:
                    msg = f"Failed to parse iCal data: {exc}"
                    logger.warning("iCal parse error for %s: %s", url, msg)
                    feed_result["errors"].append(msg)
                    continue

                # Build a prefix from the URL to identify this feed's entries
                feed_prefix = _feed_uid_prefix(url)

                # Remove old synced entries for this feed
                delete_stmt = delete(BlockedDate).where(
                    and_(
                        BlockedDate.reason == BlockedDateType.ical_sync,
                        BlockedDate.ical_uid.like(f"{feed_prefix}%"),
                    )
                )
                await self.db.execute(delete_stmt)

                # Collect new blocked dates from this feed
                for component in cal.walk():
                    if component.name != "VEVENT":
                        continue

                    try:
                        dt_start = component.get("dtstart")
                        dt_end = component.get("dtend")
                        event_uid = str(component.get("uid", ""))

                        if dt_start is None or dt_end is None:
                            continue

                        start = dt_start.dt
                        end = dt_end.dt

                        # Normalise datetime objects to date
                        if not isinstance(start, date) or hasattr(start, "hour"):
                            start = start.date() if hasattr(start, "date") else start
                        if not isinstance(end, date) or hasattr(end, "hour"):
                            end = end.date() if hasattr(end, "date") else end

                        # Create a BlockedDate for each night in the range
                        current = start
                        while current < end:
                            ical_uid = f"{feed_prefix}:{event_uid}:{current.isoformat()}"
                            blocked = BlockedDate(
                                date=current,
                                reason=BlockedDateType.ical_sync,
                                note=str(component.get("summary", "External booking")),
                                ical_uid=ical_uid,
                            )
                            self.db.add(blocked)
                            feed_result["imported"] += 1
                            current += timedelta(days=1)

                    except Exception as exc:
                        msg = f"Error processing event: {exc}"
                        logger.warning("iCal event error in %s: %s", url, msg)
                        feed_result["errors"].append(msg)
                        continue

                try:
                    await self.db.flush()
                except Exception as exc:
                    msg = f"DB flush error: {exc}"
                    logger.error("iCal DB error for %s: %s", url, msg)
                    feed_result["errors"].append(msg)

        await self.db.commit()
        return results

    async def sync_all(self) -> dict:
        """Sync all configured external iCal feeds.

        Reads the comma-separated ical_import_urls from settings and delegates
        to import_from_urls.

        Returns:
            Aggregated results dict from import_from_urls.
        """
        settings = get_settings()
        raw = settings.ical_import_urls
        if not raw or not raw.strip():
            return {}

        urls = [u.strip() for u in raw.split(",") if u.strip()]
        return await self.import_from_urls(urls)


def _feed_uid_prefix(url: str) -> str:
    """Derive a stable prefix from a feed URL for ical_uid tagging.

    This keeps all BlockedDate rows from a single feed identifiable so they
    can be bulk-deleted before re-import.
    """
    # Use a hash-like short identifier from the URL
    from hashlib import sha256

    return sha256(url.encode()).hexdigest()[:16]
