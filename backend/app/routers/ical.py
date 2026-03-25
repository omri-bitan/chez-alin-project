from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_admin
from app.config import get_settings
from app.services.ical_service import ICalService

router = APIRouter()


@router.get("/export")
async def export_ical(
    session: AsyncSession = Depends(get_db),
):
    """Export all confirmed/paid reservations as an iCal feed (.ics)."""
    ical_service = ICalService(session)
    ics_content = await ical_service.export_ical()

    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={
            "Content-Disposition": "attachment; filename=chez-aline.ics",
        },
    )


@router.post("/import")
async def import_ical(
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Trigger iCal import from configured URLs (admin only)."""
    settings = get_settings()
    raw_urls = settings.ical_import_urls
    if not raw_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No iCal import URLs configured",
        )

    urls = [u.strip() for u in raw_urls.split(",") if u.strip()]
    if not urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid iCal import URLs found",
        )

    ical_service = ICalService(session)
    results = await ical_service.import_from_urls(urls)

    return results


@router.get("/feeds")
async def list_feeds(
    _admin: dict = Depends(get_current_admin),
):
    """List configured iCal feed URLs (admin only)."""
    settings = get_settings()
    raw_urls = settings.ical_import_urls
    urls = [u.strip() for u in raw_urls.split(",") if u.strip()] if raw_urls else []

    return {"feeds": urls}
