from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.auth import get_current_admin
from app.models import Reservation, Guest, BlockedDate, ReservationStatus
from app.schemas import (
    ReservationRequest,
    ReservationOut,
    ReservationUpdate,
    GuestOut,
)
from app.services.pricing_service import PricingService

router = APIRouter()


@router.post("/", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    payload: ReservationRequest,
    session: AsyncSession = Depends(get_db),
):
    """Create a new reservation. Finds or creates guest by email."""
    if payload.check_out <= payload.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="check_out must be after check_in",
        )

    # Check for overlapping reservations
    overlap_q = select(Reservation).where(
        and_(
            Reservation.check_in < payload.check_out,
            Reservation.check_out > payload.check_in,
            Reservation.status.notin_(
                [ReservationStatus.cancelled, ReservationStatus.refunded]
            ),
        )
    )
    overlap_result = await session.execute(overlap_q)
    if overlap_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Dates overlap with an existing reservation",
        )

    # Check for blocked dates in the range
    blocked_q = select(BlockedDate).where(
        and_(
            BlockedDate.date >= payload.check_in,
            BlockedDate.date < payload.check_out,
        )
    )
    blocked_result = await session.execute(blocked_q)
    if blocked_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="One or more dates in the range are blocked",
        )

    # Calculate pricing
    pricing_service = PricingService(session)
    price = await pricing_service.calculate_price(payload.check_in, payload.check_out)

    # Find or create guest by email
    guest_q = select(Guest).where(Guest.email == payload.guest.email)
    guest_result = await session.execute(guest_q)
    guest = guest_result.scalars().first()

    if not guest:
        guest = Guest(
            first_name=payload.guest.first_name,
            last_name=payload.guest.last_name,
            email=payload.guest.email,
            phone=payload.guest.phone,
            country=payload.guest.country,
        )
        session.add(guest)
        await session.flush()
    else:
        # Update guest info with latest submission
        guest.first_name = payload.guest.first_name
        guest.last_name = payload.guest.last_name
        if payload.guest.phone:
            guest.phone = payload.guest.phone
        if payload.guest.country:
            guest.country = payload.guest.country

    reservation = Reservation(
        guest_id=guest.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        num_guests=payload.num_guests,
        nightly_rate=price.nightly_rate,
        num_nights=price.num_nights,
        subtotal=price.subtotal,
        cleaning_fee=price.cleaning_fee,
        total_price=price.total,
        special_requests=payload.special_requests,
    )
    session.add(reservation)
    await session.flush()
    await session.refresh(reservation, attribute_names=["guest"])

    return reservation


@router.get("/", response_model=list[ReservationOut])
async def list_reservations(
    status_filter: ReservationStatus | None = Query(None, alias="status"),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """List reservations with optional filters (admin only)."""
    q = select(Reservation).options(selectinload(Reservation.guest))

    if status_filter:
        q = q.where(Reservation.status == status_filter)
    if date_from:
        q = q.where(Reservation.check_in >= date_from)
    if date_to:
        q = q.where(Reservation.check_in <= date_to)

    q = q.order_by(Reservation.check_in.desc())
    result = await session.execute(q)
    return result.scalars().all()


@router.get("/{reservation_id}", response_model=ReservationOut)
async def get_reservation(
    reservation_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Get a single reservation by ID (public — used for confirmation page)."""
    q = (
        select(Reservation)
        .options(selectinload(Reservation.guest))
        .where(Reservation.id == reservation_id)
    )
    result = await session.execute(q)
    reservation = result.scalars().first()
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )
    return reservation


@router.patch("/{reservation_id}", response_model=ReservationOut)
async def update_reservation(
    reservation_id: str,
    payload: ReservationUpdate,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Update a reservation (admin only)."""
    q = (
        select(Reservation)
        .options(selectinload(Reservation.guest))
        .where(Reservation.id == reservation_id)
    )
    result = await session.execute(q)
    reservation = result.scalars().first()
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reservation, field, value)

    await session.flush()
    await session.refresh(reservation)
    return reservation


@router.delete("/{reservation_id}", response_model=ReservationOut)
async def cancel_reservation(
    reservation_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Cancel a reservation by setting status to cancelled."""
    q = (
        select(Reservation)
        .options(selectinload(Reservation.guest))
        .where(Reservation.id == reservation_id)
    )
    result = await session.execute(q)
    reservation = result.scalars().first()
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    if reservation.status == ReservationStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation is already cancelled",
        )

    reservation.status = ReservationStatus.cancelled
    await session.flush()
    await session.refresh(reservation)
    return reservation
