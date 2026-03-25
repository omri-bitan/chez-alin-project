from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Chez Aline — Booking API",
    description="Direct booking backend for Chez Aline vacation rental in Chamonix",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import reservations, availability, payments, ical, admin, property, guests, reviews  # noqa: E402

app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reservations.router, prefix="/api/reservations", tags=["Reservations"])
app.include_router(availability.router, prefix="/api/availability", tags=["Availability"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(ical.router, prefix="/api/ical", tags=["iCal"])
app.include_router(property.router, prefix="/api/property", tags=["Property"])
app.include_router(guests.router, prefix="/api/guests", tags=["Guests"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Reviews"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "property": settings.property_name}
