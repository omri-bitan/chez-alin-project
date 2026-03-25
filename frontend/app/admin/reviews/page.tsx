"use client";

import * as React from "react";
import {
  getReviews,
  updateReview,
  deleteReview,
  type Review,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2Icon,
  StarIcon,
  Trash2Icon,
  MessageSquareIcon,
} from "lucide-react";

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <StarIcon
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-amber-500 text-amber-500"
              : "fill-none text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Review | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function togglePublished(review: Review) {
    try {
      const updated = await updateReview(review.id, {
        is_published: !review.is_published,
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? updated : r))
      );
    } catch {
      // silently handle
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReview(deleteTarget.id);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // silently handle
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-destructive">Failed to load reviews</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          {reviews.length} reviews — {reviews.filter((r) => r.is_published).length}{" "}
          published
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquareIcon className="h-8 w-8" />
            <p>No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className={
                review.is_published ? "" : "opacity-60"
              }
            >
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Stars rating={review.rating} />
                    <span className="text-sm font-medium">
                      {review.guest_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {review.text}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`publish-${review.id}`}
                      checked={review.is_published}
                      onCheckedChange={() => togglePublished(review)}
                    />
                    <Label
                      htmlFor={`publish-${review.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      {review.is_published ? "Published" : "Hidden"}
                    </Label>
                  </div>

                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(review)}
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review from{" "}
              {deleteTarget?.guest_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
