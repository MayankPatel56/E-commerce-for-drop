"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Star,
  Search,
  Check,
  X,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminReviewsTableProps {
  onRefresh?: () => void;
}

interface ReviewCustomer {
  id: string;
  name: string;
  email: string;
}

interface ReviewProduct {
  id: number;
  name: string;
  slug: string;
  primaryImage: string | null;
}

interface Review {
  id: number;
  productId: number;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
  status: "pending" | "approved" | "rejected" | "hidden";
  reviewedAt: string | null;
  createdAt: string;
  customer: ReviewCustomer;
  product: ReviewProduct;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  hidden: number;
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: PaginationInfo;
  counts: StatusCounts;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterStatus = "all" | "pending" | "approved" | "rejected" | "hidden";
type ModerateAction = "approve" | "reject" | "hide" | "delete";

const STATUS_TABS: { label: string; value: FilterStatus; countKey?: keyof StatusCounts }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending", countKey: "pending" },
  { label: "Approved", value: "approved", countKey: "approved" },
  { label: "Rejected", value: "rejected", countKey: "rejected" },
  { label: "Hidden", value: "hidden", countKey: "hidden" },
];

const PAGE_LIMIT = 20;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Display 1-5 filled / empty yellow stars */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  );
}

/** Coloured status badge */
function StatusBadge({ status }: { status: Review["status"] }) {
  const styles: Record<Review["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800",
    approved: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
    rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
    hidden: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

/** Truncate long text */
function TruncatedText({ text, max = 60 }: { text: string; max?: number }) {
  if (text.length <= max) return <span>{text}</span>;
  return (
    <span title={text}>
      {text.slice(0, max)}…
    </span>
  );
}

/** Table rows skeleton shown while loading */
function TableSkeleton() {
  const rows = 8;
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-40" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/** Empty state when no reviews match the current filter */
function EmptyState({ filter, search }: { filter: FilterStatus; search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <MessageSquare className="size-12 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-medium text-foreground">No reviews found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {search
          ? `No reviews matching "${search}"${filter !== "all" ? ` with status "${filter}"` : ""}.`
          : filter !== "all"
            ? `There are no ${filter} reviews at the moment.`
            : "There are no reviews to display."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AdminReviewsTable({ onRefresh }: AdminReviewsTableProps) {
  // -- State ------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [moderating, setModerating] = useState<number | null>(null); // review id currently being actioned
  const [isPendingTransition, startTransition] = useTransition();

  // -- Debounced search -------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // reset page when search changes
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // -- Fetch reviews ----------------------------------------------------------
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/reviews?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch reviews (${res.status})`);
      const json: ReviewsResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // -- Reset page when tab changes --------------------------------------------
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // -- Moderate action --------------------------------------------------------
  const handleModerate = async (reviewId: number, action: ModerateAction) => {
    if (action === "delete") {
      const confirmed = window.confirm(
        "Are you sure you want to permanently delete this review? This action cannot be undone."
      );
      if (!confirmed) return;
    }

    setModerating(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Moderation failed (${res.status})`);
      // Refresh data
      await fetchReviews();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setModerating(null);
    }
  };

  // -- Helpers ----------------------------------------------------------------
  const reviews = data?.reviews ?? [];
  const pagination = data?.pagination;
  const counts = data?.counts;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // -- Page number generation for pagination ---------------------------------
  const getPageNumbers = (currentPage: number, totalPages: number): number[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: number[] = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push(-1); // ellipsis
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push(-1);
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push(-1);
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push(-1);
      pages.push(totalPages);
    }
    return pages;
  };

  // -- Render -----------------------------------------------------------------
  return (
    <Card>
      {/* ---- Header with title ---- */}
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">Review Management</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ---- Filter tabs ---- */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const count = tab.countKey && counts ? counts[tab.countKey] : undefined;

            return (
              <Button
                key={tab.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => startTransition(() => setActiveTab(tab.value))}
                disabled={isPendingTransition}
                className="gap-1.5"
              >
                {tab.label}
                {count !== undefined && (
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px] font-semibold leading-none"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* ---- Search input ---- */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, product, or comment…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* ---- Error banner ---- */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* ---- Table ---- */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="w-[100px]">Rating</TableHead>
                <TableHead className="w-[160px]">Title</TableHead>
                <TableHead className="hidden md:table-cell">Comment</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead className="w-[180px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState filter={activeTab} search={debouncedSearch} />
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    {/* Customer */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{review.customer.name}</span>
                        <span className="text-xs text-muted-foreground">{review.customer.email}</span>
                      </div>
                    </TableCell>

                    {/* Product */}
                    <TableCell>
                      <a
                        href={`/product/${review.product.slug}`}
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {review.product.name}
                      </a>
                    </TableCell>

                    {/* Rating */}
                    <TableCell>
                      <StarRating rating={review.rating} />
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <span className="text-sm font-medium">{review.title}</span>
                    </TableCell>

                    {/* Comment (truncated, hidden on mobile) */}
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        <TruncatedText text={review.comment} max={80} />
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={review.status} />
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Pending → Approve + Reject */}
                        {review.status === "pending" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 gap-1 bg-green-600 text-white hover:bg-green-700"
                              disabled={moderating === review.id}
                              onClick={() => handleModerate(review.id, "approve")}
                            >
                              {moderating === review.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              <span className="hidden lg:inline">Approve</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 gap-1 bg-red-600 text-white hover:bg-red-700"
                              disabled={moderating === review.id}
                              onClick={() => handleModerate(review.id, "reject")}
                            >
                              {moderating === review.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5" />
                              )}
                              <span className="hidden lg:inline">Reject</span>
                            </Button>
                          </>
                        )}

                        {/* Approved → Hide */}
                        {review.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1"
                            disabled={moderating === review.id}
                            onClick={() => handleModerate(review.id, "hide")}
                          >
                            {moderating === review.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="size-3.5" />
                            )}
                            <span className="hidden lg:inline">Hide</span>
                          </Button>
                        )}

                        {/* Hidden → Approve (restore) */}
                        {review.status === "hidden" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1"
                            disabled={moderating === review.id}
                            onClick={() => handleModerate(review.id, "approve")}
                          >
                            {moderating === review.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                            <span className="hidden lg:inline">Restore</span>
                          </Button>
                        )}

                        {/* Rejected → no action buttons */}

                        {/* Delete (all statuses) */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
                          disabled={moderating === review.id}
                          onClick={() => handleModerate(review.id, "delete")}
                        >
                          {moderating === review.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                          <span className="hidden lg:inline">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ---- Pagination ---- */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 px-2 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{pagination.total}</span>{" "}
              reviews
            </p>

            <nav aria-label="Pagination" className="flex items-center gap-1">
              {/* First */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="size-4" />
                <span className="sr-only">First page</span>
              </Button>

              {/* Previous */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                <span className="sr-only">Previous page</span>
              </Button>

              {/* Page numbers */}
              {getPageNumbers(pagination.page, pagination.totalPages).map((p, idx) =>
                p === -1 ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex size-8 items-center justify-center text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === pagination.page ? "default" : "outline"}
                    size="icon"
                    className="size-8"
                    onClick={() => setPage(p)}
                  >
                    {p}
                    <span className="sr-only">Page {p}</span>
                  </Button>
                )
              )}

              {/* Next */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">Next page</span>
              </Button>

              {/* Last */}
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.totalPages)}
              >
                <ChevronsRight className="size-4" />
                <span className="sr-only">Last page</span>
              </Button>
            </nav>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
