from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_admin
from app.config import get_settings
from app.models import SeasonalRate, PropertySettings
from app.schemas import (
    PropertySettingsOut,
    PropertySettingsUpdate,
    SeasonalRateCreate,
    SeasonalRateOut,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# DB-backed config helpers
# ---------------------------------------------------------------------------

async def get_config_value(session: AsyncSession, key: str, default: str = "") -> str:
    """Read a config value from PropertySettings table, fall back to default."""
    result = await session.execute(
        select(PropertySettings).where(PropertySettings.key == key)
    )
    row = result.scalar_one_or_none()
    if row:
        return row.value
    return default


async def set_config_value(session: AsyncSession, key: str, value: str):
    """Write a config value to PropertySettings table (upsert)."""
    result = await session.execute(
        select(PropertySettings).where(PropertySettings.key == key)
    )
    row = result.scalar_one_or_none()
    if row:
        row.value = value
    else:
        session.add(PropertySettings(key=key, value=value))


# ---------------------------------------------------------------------------
# Config-key ↔ env-default mapping
# ---------------------------------------------------------------------------

def _env_defaults() -> dict[str, str]:
    """Return a dict of config keys with their env/default fallback values."""
    s = get_settings()
    return {
        "property_name": s.property_name,
        "property_address": s.property_address,
        "property_description": s.property_description,
        "property_currency": s.property_currency,
        "property_timezone": s.property_timezone,
        "default_nightly_rate": str(s.default_nightly_rate),
        "cleaning_fee": str(s.cleaning_fee),
        "min_stay": str(s.min_stay),
        "max_guests": str(s.max_guests),
        "check_in_time": s.check_in_time,
        "check_out_time": s.check_out_time,
        "contact_phone": s.contact_phone,
        "contact_email": s.contact_email,
        "contact_website": s.contact_website,
        "ical_import_urls": s.ical_import_urls,
    }


async def _build_settings_out(
    session: AsyncSession, request: Request
) -> PropertySettingsOut:
    """Read all config keys from DB (with env fallbacks) and return the schema."""
    settings = get_settings()
    defaults = _env_defaults()

    # Batch-read all keys
    vals: dict[str, str] = {}
    for key, fallback in defaults.items():
        vals[key] = await get_config_value(session, key, fallback)

    # Parse comma-separated iCal URLs into a list
    raw_ical = vals["ical_import_urls"].strip()
    ical_list = [u.strip() for u in raw_ical.split(",") if u.strip()] if raw_ical else []

    return PropertySettingsOut(
        name=vals["property_name"],
        address=vals["property_address"],
        description=vals["property_description"],
        currency=vals["property_currency"],
        timezone=vals["property_timezone"],
        default_nightly_rate=float(vals["default_nightly_rate"]),
        cleaning_fee=float(vals["cleaning_fee"]),
        min_stay=int(vals["min_stay"]),
        max_guests=int(vals["max_guests"]),
        check_in_time=vals["check_in_time"],
        check_out_time=vals["check_out_time"],
        contact_phone=vals["contact_phone"],
        contact_email=vals["contact_email"],
        contact_website=vals["contact_website"],
        ical_import_urls=ical_list,
        ical_export_url=f"{request.base_url}api/ical/export",
        stripe_configured=bool(settings.stripe_secret_key),
        smtp_configured=bool(settings.smtp_host),
        admin_email=settings.admin_email,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=PropertySettingsOut)
async def get_property_settings(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """Return comprehensive property settings (DB values with env fallbacks)."""
    return await _build_settings_out(session, request)


@router.put("/settings", response_model=PropertySettingsOut)
async def update_property_settings(
    payload: PropertySettingsUpdate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Update property settings (admin only). Only provided fields are changed."""
    # Map schema fields → DB config keys
    field_to_key = {
        "name": "property_name",
        "address": "property_address",
        "description": "property_description",
        "currency": "property_currency",
        "timezone": "property_timezone",
        "default_nightly_rate": "default_nightly_rate",
        "cleaning_fee": "cleaning_fee",
        "min_stay": "min_stay",
        "max_guests": "max_guests",
        "check_in_time": "check_in_time",
        "check_out_time": "check_out_time",
        "contact_phone": "contact_phone",
        "contact_email": "contact_email",
        "contact_website": "contact_website",
        "ical_import_urls": "ical_import_urls",
    }

    data = payload.model_dump(exclude_none=True)
    for field, db_key in field_to_key.items():
        if field in data:
            value = data[field]
            # Join list back to comma-separated string for iCal URLs
            if field == "ical_import_urls":
                value = ",".join(value)
            else:
                value = str(value)
            await set_config_value(session, db_key, value)

    await session.flush()
    return await _build_settings_out(session, request)


@router.get("/rates", response_model=list[SeasonalRateOut])
async def list_rates(
    session: AsyncSession = Depends(get_db),
):
    """List all seasonal rates."""
    q = select(SeasonalRate).order_by(SeasonalRate.start_date)
    result = await session.execute(q)
    return result.scalars().all()


@router.post("/rates", response_model=SeasonalRateOut, status_code=status.HTTP_201_CREATED)
async def create_rate(
    payload: SeasonalRateCreate,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Create a seasonal rate (admin only)."""
    if payload.end_date <= payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be after start_date",
        )

    rate = SeasonalRate(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        nightly_rate=payload.nightly_rate,
        min_stay=payload.min_stay,
    )
    session.add(rate)
    await session.flush()
    await session.refresh(rate)
    return rate


@router.put("/rates/{rate_id}", response_model=SeasonalRateOut)
async def update_rate(
    rate_id: str,
    payload: SeasonalRateCreate,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Update a seasonal rate (admin only)."""
    q = select(SeasonalRate).where(SeasonalRate.id == rate_id)
    result = await session.execute(q)
    rate = result.scalars().first()

    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seasonal rate not found",
        )

    if payload.end_date <= payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be after start_date",
        )

    rate.name = payload.name
    rate.start_date = payload.start_date
    rate.end_date = payload.end_date
    rate.nightly_rate = payload.nightly_rate
    rate.min_stay = payload.min_stay

    await session.flush()
    await session.refresh(rate)
    return rate


@router.delete("/rates/{rate_id}", status_code=status.HTTP_200_OK)
async def delete_rate(
    rate_id: str,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Delete a seasonal rate (admin only)."""
    q = select(SeasonalRate).where(SeasonalRate.id == rate_id)
    result = await session.execute(q)
    rate = result.scalars().first()

    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seasonal rate not found",
        )

    await session.delete(rate)
    await session.flush()
    return {"detail": "Seasonal rate deleted"}
