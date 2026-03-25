from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth import get_current_admin
from app.models import Review
from app.schemas import ReviewCreate, ReviewOut

router = APIRouter()


class ReviewPublishToggle(BaseModel):
    is_published: bool


@router.get("/", response_model=list[ReviewOut])
async def list_reviews(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
):
    """List published reviews (public)."""
    q = (
        select(Review)
        .where(Review.is_published.is_(True))
        .order_by(Review.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(q)
    return result.scalars().all()


@router.post("/", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreate,
    session: AsyncSession = Depends(get_db),
):
    """Submit a review (public). Starts unpublished for moderation."""
    review = Review(
        guest_name=payload.guest_name,
        rating=payload.rating,
        text=payload.text,
        source=payload.source,
        stay_date=payload.stay_date,
        is_published=False,
    )
    session.add(review)
    await session.flush()
    await session.refresh(review)
    return review


@router.patch("/{review_id}", response_model=ReviewOut)
async def toggle_review_published(
    review_id: str,
    payload: ReviewPublishToggle,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Toggle published status of a review (admin only)."""
    q = select(Review).where(Review.id == review_id)
    result = await session.execute(q)
    review = result.scalars().first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    review.is_published = payload.is_published
    await session.flush()
    await session.refresh(review)
    return review


@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
async def delete_review(
    review_id: str,
    session: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """Delete a review (admin only)."""
    q = select(Review).where(Review.id == review_id)
    result = await session.execute(q)
    review = result.scalars().first()

    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    await session.delete(review)
    await session.flush()
    return {"detail": "Review deleted"}
