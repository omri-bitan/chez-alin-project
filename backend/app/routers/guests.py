from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.auth import get_current_admin
from app.models import Guest, Reservation
from app.schemas import GuestOut, ReservationOut

router = APIRouter()


class GuestWithReservations(GuestOut):
    reservations: list[ReservationOut] = []


class GuestNotesUpdate(BaseModel):
    notes: str | None = None


@router.get("/", response_model=list[GuestOut])
async def list_guests(
    search: str | None = Query(None, description="Search by name or email"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """List guests with pagination and optional search (admin only)."""
    q = select(Guest)

    if search:
        search_term = f"%{search}%"
        q = q.where(
            or_(
                Guest.first_name.ilike(search_term),
                Guest.last_name.ilike(search_term),
                Guest.email.ilike(search_term),
            )
        )

    q = q.order_by(Guest.created_at.desc()).limit(limit).offset(offset)
    result = await session.execute(q)
    return result.scalars().all()


@router.get("/{guest_id}", response_model=GuestWithReservations)
async def get_guest(
    guest_id: str,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Get a guest with their reservations (admin only)."""
    q = (
        select(Guest)
        .options(selectinload(Guest.reservations))
        .where(Guest.id == guest_id)
    )
    result = await session.execute(q)
    guest = result.scalars().first()

    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found",
        )

    return guest


@router.patch("/{guest_id}", response_model=GuestOut)
async def update_guest_notes(
    guest_id: str,
    payload: GuestNotesUpdate,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Update guest notes (admin only)."""
    q = select(Guest).where(Guest.id == guest_id)
    result = await session.execute(q)
    guest = result.scalars().first()

    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found",
        )

    guest.notes = payload.notes
    await session.flush()
    await session.refresh(guest)
    return guest
