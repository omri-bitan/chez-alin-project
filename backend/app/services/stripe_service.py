import logging

import stripe

from app.config import get_settings, Settings
from app.models import Reservation

logger = logging.getLogger(__name__)


class StripeService:
    """Handles Stripe payment operations for the booking flow."""

    async def create_checkout_session(
        self, reservation: Reservation, settings: Settings
    ) -> dict:
        """Create a Stripe Checkout Session for a reservation.

        Builds line items for the nightly stay and cleaning fee, sets metadata
        with the reservation ID, and configures success/cancel redirect URLs.

        Args:
            reservation: The Reservation ORM instance to charge for.
            settings: Application settings (Stripe keys, frontend URL, etc.).

        Returns:
            Dict with 'url' (checkout page URL) and 'id' (session ID).
        """
        stripe.api_key = settings.stripe_secret_key

        line_items = [
            {
                "price_data": {
                    "currency": settings.property_currency.lower(),
                    "product_data": {
                        "name": f"{settings.property_name} — {reservation.num_nights} night(s)",
                    },
                    "unit_amount": int(reservation.nightly_rate * 100),
                },
                "quantity": reservation.num_nights,
            },
        ]

        if reservation.cleaning_fee > 0:
            line_items.append(
                {
                    "price_data": {
                        "currency": settings.property_currency.lower(),
                        "product_data": {
                            "name": "Cleaning fee",
                        },
                        "unit_amount": int(reservation.cleaning_fee * 100),
                    },
                    "quantity": 1,
                }
            )

        success_url = (
            f"{settings.frontend_url}/booking/confirmation"
            f"?reservation_id={reservation.id}"
        )
        cancel_url = f"{settings.frontend_url}/booking/cancelled"

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=line_items,
            metadata={"reservation_id": reservation.id},
            success_url=success_url,
            cancel_url=cancel_url,
        )

        return {"url": session.url, "id": session.id}

    def verify_webhook(
        self, payload: bytes, sig_header: str, webhook_secret: str
    ) -> dict:
        """Verify a Stripe webhook signature and return the parsed event.

        Args:
            payload: Raw request body bytes.
            sig_header: Value of the Stripe-Signature header.
            webhook_secret: The endpoint's webhook signing secret.

        Returns:
            The verified Stripe event as a dict.

        Raises:
            stripe.error.SignatureVerificationError: If the signature is invalid.
            ValueError: If the payload cannot be parsed.
        """
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        return event

    async def create_refund(
        self, payment_intent_id: str, amount: int | None = None
    ) -> dict:
        """Create a full or partial refund for a payment.

        Args:
            payment_intent_id: The Stripe PaymentIntent ID to refund.
            amount: Amount in cents for a partial refund. If None, the full
                    amount is refunded.

        Returns:
            The Stripe Refund object as a dict.
        """
        settings = get_settings()
        stripe.api_key = settings.stripe_secret_key

        params: dict = {"payment_intent": payment_intent_id}
        if amount is not None:
            params["amount"] = amount

        refund = stripe.Refund.create(**params)
        return dict(refund)

    async def get_payment_status(self, session_id: str) -> dict:
        """Retrieve the current status of a Stripe Checkout Session.

        Args:
            session_id: The Checkout Session ID.

        Returns:
            Dict with session details including payment_status and status.
        """
        settings = get_settings()
        stripe.api_key = settings.stripe_secret_key

        session = stripe.checkout.Session.retrieve(session_id)
        return {
            "id": session.id,
            "status": session.status,
            "payment_status": session.payment_status,
            "payment_intent": session.payment_intent,
            "amount_total": session.amount_total,
            "currency": session.currency,
            "metadata": dict(session.metadata) if session.metadata else {},
        }
