# Chez Aline — Direct Booking Platform

A complete direct-booking website for vacation rentals. Built with Next.js (frontend) and FastAPI (backend).

**Live:** [chez-aline.vercel.app](https://chez-aline.vercel.app)

## Structure

```
chez-aline-project/
├── frontend/    — Next.js 16 + shadcn/ui (dark mode, amber accents)
├── backend/     — FastAPI + SQLAlchemy (async, SQLite/Postgres)
└── README.md
```

## Frontend

- Public site: hero, gallery, booking widget, amenities, location, reviews
- Admin dashboard: reservations, calendar, guests, reviews, pricing, settings
- Tech: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui

## Backend

- Reservation management with availability checking
- Stripe payment integration (checkout sessions + webhooks)
- iCal sync (export + import from Booking.com/Airbnb)
- Dynamic pricing (seasonal rates)
- JWT admin auth
- Tech: FastAPI, SQLAlchemy (async), Pydantic, Stripe SDK, icalendar

## Quick Start

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # edit with your values
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

## Deploy

Both projects deploy to Vercel:
- Frontend: `cd frontend && vercel --prod`
- Backend: `cd backend && vercel --prod`

Set `NEXT_PUBLIC_API_URL` in the frontend's Vercel env vars to point to the backend URL.

## Environment Variables

### Backend (Vercel env vars)
| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing key |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | For payments | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | For payments | Stripe webhook signing secret |
| `SMTP_HOST` | For emails | SMTP server host |
| `SMTP_PORT` | For emails | SMTP port (default: 587) |
| `SMTP_USER` | For emails | SMTP username |
| `SMTP_PASSWORD` | For emails | SMTP password |

### Frontend (Vercel env vars)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |

## Admin Dashboard

Login at `/admin/login` with the configured admin credentials.

Pages: Dashboard, Reservations, Calendar, Guests, Reviews, Pricing, Settings.
