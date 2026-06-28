"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Plus, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductOption {
  id: number;
  name: string;
}

interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

interface AddReviewDialogProps {
  onCreated: () => void;
}

export function AddReviewDialog({ onCreated }: AddReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Product list
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState<string>("");

  // Customer linking
  const [useExisting, setUseExisting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [displayName, setDisplayName] = useState("");

  // Review fields
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [status, setStatus] = useState<"approved" | "pending">("approved");

  // Load products when dialog opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/products?limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.products) {
          setProducts(json.products.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => setProducts([]));
  }, [open]);

  // Debounced customer search
  useEffect(() => {
    if (!useExisting || !customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/admin/customers?search=${encodeURIComponent(customerSearch)}&limit=8`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => setCustomerResults(json?.customers ?? []))
        .catch(() => setCustomerResults([]));
    }, 350);
    return () => clearTimeout(timer);
  }, [customerSearch, useExisting]);

  const resetForm = useCallback(() => {
    setProductId("");
    setUseExisting(false);
    setCustomerSearch("");
    setCustomerResults([]);
    setSelectedCustomer(null);
    setDisplayName("");
    setRating(5);
    setTitle("");
    setComment("");
    setPhotoUrl("");
    setStatus("approved");
    setFormError(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!productId) {
      setFormError("Please select a product.");
      return;
    }
    if (useExisting && !selectedCustomer) {
      setFormError("Please select a customer, or switch to a display name.");
      return;
    }
    if (!useExisting && !displayName.trim()) {
      setFormError("Please enter a reviewer display name.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        productId: Number(productId),
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
        photoUrl: photoUrl.trim() || null,
        status,
        ...(useExisting && selectedCustomer
          ? { customerId: selectedCustomer.id }
          : { displayName: displayName.trim() }),
      };

      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to create review (${res.status})`);
      }

      handleOpenChange(false);
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add Review
      </Button>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product */}
          <div className="space-y-1.5">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reviewer: existing customer vs display name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Reviewer</Label>
              <button
                type="button"
                onClick={() => {
                  setUseExisting((v) => !v);
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                  setDisplayName("");
                }}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                {useExisting ? "Use display name instead" : "Link to existing customer"}
              </button>
            </div>

            {useExisting ? (
              selectedCustomer ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{selectedCustomer.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedCustomer.email}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customer by name or email…"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {customerResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-md border">
                      {customerResults.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerResults([]);
                          }}
                          className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : (
              <Input
                placeholder="e.g. Priya S."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className="p-0.5"
                  aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                >
                  <Star
                    className={`size-6 ${
                      n <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-transparent text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title (optional)</Label>
            <Input
              placeholder="Amazing quality!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <Label>Comment (optional)</Label>
            <Textarea
              placeholder="Write the review text…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Photo URL */}
          <div className="space-y-1.5">
            <Label>Photo URL (optional)</Label>
            <Input
              placeholder="https://…"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "approved" | "pending")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved (visible immediately)</SelectItem>
                <SelectItem value="pending">Pending (needs moderation)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Add Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}