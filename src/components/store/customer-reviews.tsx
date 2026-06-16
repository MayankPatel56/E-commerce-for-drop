"use client";

import React, { useState, useCallback } from "react";
import {
  Star,
  Edit3,
  Loader2,
  Package,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CustomerReviewsProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

interface ReviewProduct {
  id: number;
  name: string;
  slug: string;
  primaryImage: string | null;
}

interface CustomerReview {
  id: number;
  productId: number;
  rating: number;
  title: string;
  comment: string;
  status: "pending" | "approved" | "rejected" | "hidden";
  reviewedAt: string;
  createdAt: string;
  product: ReviewProduct;
}

type ReviewStatus = CustomerReview["status"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function statusBadge(status: ReviewStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
          Rejected
        </Badge>
      );
    case "hidden":
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
          Hidden
        </Badge>
      );
  }
}

function canEdit(status: ReviewStatus): boolean {
  return status !== "rejected";
}

// ─── Star Display ────────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-gray-300"
          }
        />
      ))}
    </div>
  );
}

// ─── Interactive Star Rating (for edit mode) ────────────────────────────────

function InteractiveStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className="p-0.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-yellow-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={24}
            className={
              star <= display
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-4 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-12 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Edit Review Dialog ────────────────────────────────────────────────────

function EditReviewDialog({
  review,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  review: CustomerReview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { rating: number; title: string; comment: string }) => void;
  saving: boolean;
}) {
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title);
  const [comment, setComment] = useState(review.comment);

  const handleSave = () => {
    if (!title.trim() || !comment.trim()) return;
    onSave({ rating, title: title.trim(), comment: comment.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Product name (read-only context) */}
          <div>
            <p className="text-sm text-muted-foreground">
              Reviewing:{" "}
              <span className="font-medium text-foreground">
                {review.product.name}
              </span>
            </p>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <InteractiveStarRating value={rating} onChange={setRating} />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-review-title">Title</Label>
            <Input
              id="edit-review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review title"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="edit-review-comment">Comment</Label>
            <Textarea
              id="edit-review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !comment.trim()}
            className="min-h-[44px]"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CustomerReviews({ onNavigate }: CustomerReviewsProps) {
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── Fetch Reviews ──────────────────────────────────────────────────────

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customer/reviews");
      if (!res.ok) {
        throw new Error("Failed to load reviews");
      }
      const data: CustomerReview[] = await res.json();
      setReviews(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ─── Save Edited Review ────────────────────────────────────────────────

  const handleSaveReview = async (data: {
    rating: number;
    title: string;
    comment: string;
  }) => {
    if (!editingReview) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reviews/${editingReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to save review");
      }
      setEditDialogOpen(false);
      setEditingReview(null);
      await fetchReviews();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save review"
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Open Edit Dialog ─────────────────────────────────────────────────

  const openEdit = (review: CustomerReview) => {
    setEditingReview(review);
    setEditDialogOpen(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My Reviews
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage the reviews you&apos;ve submitted
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Loading */}
      {loading && <ReviewsSkeleton />}

      {/* Error */}
      {error && !loading && (
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button
              variant="outline"
              onClick={fetchReviews}
              className="min-h-[44px]"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && reviews.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No reviews yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                You haven&apos;t written any reviews yet. Browse products and share your
                thoughts!
              </p>
            </div>
            <Button
              onClick={() => onNavigate("shop")}
              className="min-h-[44px] mt-2"
            >
              Browse Products
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {!loading && !error && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4 sm:p-6">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4">
                  {/* Top row: Product name + Status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate("product", {
                            slug: review.product.slug,
                          })
                        }
                        className="text-sm font-medium text-primary hover:underline truncate block text-left min-h-[44px] flex items-center"
                      >
                        {review.product.name}
                      </button>
                    </div>
                    {statusBadge(review.status)}
                  </div>

                  {/* Star rating */}
                  <StarDisplay rating={review.rating} />

                  {/* Title */}
                  <h3 className="text-base font-semibold leading-snug">
                    {review.title}
                  </h3>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  )}

                  {/* Bottom row: Date + Edit button */}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-muted-foreground">
                      Reviewed on {formatDate(review.reviewedAt || review.createdAt)}
                    </p>
                    {canEdit(review.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(review)}
                        className="min-h-[44px] min-w-[44px] text-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingReview && (
        <EditReviewDialog
          key={editingReview.id}
          review={editingReview}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingReview(null);
          }}
          onSave={handleSaveReview}
          saving={saving}
        />
      )}
    </div>
  );
}
