from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models import Reservation, ReservationStatus
from app.schemas import CheckoutSessionOut
from app.services.stripe_service import StripeService

router = APIRouter()


@router.post("/create-checkout", response_model=CheckoutSessionOut)
async def create_checkout_session(
    reservation_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Create a Stripe checkout session for a reservation."""
    q = select(Reservation).where(Reservation.id == reservation_id)
    result = await session.execute(q)
    reservation = result.scalars().first()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    if reservation.status not in (
        ReservationStatus.pending,
        ReservationStatus.confirmed,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pay for reservation with status '{reservation.status.value}'",
        )

    settings = get_settings()
    stripe_service = StripeService()
    checkout = await stripe_service.create_checkout_session(reservation, settings)

    reservation.stripe_session_id = checkout["id"]
    await session.flush()

    return CheckoutSessionOut(
        checkout_url=checkout["url"],
        session_id=checkout["id"],
    )


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhook events. Verifies signature and processes checkout completion."""
    settings = get_settings()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header",
        )

    stripe_service = StripeService()
    try:
        event = stripe_service.verify_webhook(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature",
        )

    if event.get("type") == "checkout.session.completed":
        checkout_session = event["data"]["object"]
        stripe_session_id = checkout_session["id"]
        payment_intent = checkout_session.get("payment_intent")

        q = select(Reservation).where(
            Reservation.stripe_session_id == stripe_session_id
        )
        result = await session.execute(q)
        reservation = result.scalars().first()

        if reservation:
            reservation.status = ReservationStatus.paid
            reservation.stripe_payment_intent = payment_intent
            await session.flush()

    return {"status": "ok"}


@router.get("/status/{reservation_id}")
async def get_payment_status(
    reservation_id: str,
    session: AsyncSession = Depends(get_db),
):
    """Check payment status for a reservation."""
    q = select(Reservation).where(Reservation.id == reservation_id)
    result = await session.execute(q)
    reservation = result.scalars().first()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    return {
        "reservation_id": reservation.id,
        "status": reservation.status.value,
        "stripe_session_id": reservation.stripe_session_id,
        "stripe_payment_intent": reservation.stripe_payment_intent,
        "total_price": reservation.total_price,
    }
