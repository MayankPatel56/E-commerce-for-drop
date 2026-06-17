"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Search,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  MessageSquare,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Faq {
  id: number;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add new
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Toggle active
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reorder
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  // ── Fetch FAQs ─────────────────────────────────────────────────────────────

  const fetchFaqs = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = search
        ? `/api/admin/faq?search=${encodeURIComponent(search)}`
        : "/api/admin/faq";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load FAQs"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // ── Debounced search ───────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchDebounce(value);
    }, 300);
  };

  useEffect(() => {
    fetchFaqs(searchDebounce || undefined);
  }, [searchDebounce, fetchFaqs]);

  // ── Add FAQ ────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    const q = newQuestion.trim();
    const a = newAnswer.trim();
    if (!q) {
      toast.error("Question is required");
      return;
    }
    if (!a) {
      toast.error("Answer is required");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          answer: a,
          displayOrder: faqs.length,
          isActive: true,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create FAQ");
      }

      toast.success("FAQ created successfully");
      setNewQuestion("");
      setNewAnswer("");
      setShowAddForm(false);
      fetchFaqs(searchDebounce || undefined);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create FAQ"
      );
    } finally {
      setIsAdding(false);
    }
  };

  // ── Inline edit ────────────────────────────────────────────────────────────

  const startEdit = (faq: Faq) => {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const q = editQuestion.trim();
    const a = editAnswer.trim();
    if (!q) {
      toast.error("Question is required");
      return;
    }
    if (!a) {
      toast.error("Answer is required");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/faq/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, answer: a }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update FAQ");
      }

      toast.success("FAQ updated successfully");
      setEditingId(null);
      fetchFaqs(searchDebounce || undefined);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update FAQ"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────────

  const handleToggleActive = async (faq: Faq) => {
    setTogglingId(faq.id);
    try {
      const res = await fetch(`/api/admin/faq/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !faq.isActive }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to toggle FAQ");
      }

      fetchFaqs(searchDebounce || undefined);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle FAQ"
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/faq/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to delete FAQ");
      }

      toast.success("FAQ deleted successfully");
      setDeleteTarget(null);
      fetchFaqs(searchDebounce || undefined);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete FAQ"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Reorder ────────────────────────────────────────────────────────────────

  const handleReorder = async (faq: Faq, direction: "up" | "down") => {
    const sorted = [...faqs].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((f) => f.id === faq.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;

    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const swapFaq = sorted[targetIdx];
    const newOrder = faq.displayOrder;
    const swapOrder = swapFaq.displayOrder;

    setReorderingId(faq.id);

    try {
      await Promise.all([
        fetch(`/api/admin/faq/${faq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: swapOrder }),
        }),
        fetch(`/api/admin/faq/${swapFaq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: newOrder }),
        }),
      ]);

      fetchFaqs(searchDebounce || undefined);
    } catch {
      toast.error("Failed to reorder FAQ");
    } finally {
      setReorderingId(null);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
        <h3 className="text-lg font-medium">Failed to load FAQs</h3>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button onClick={() => fetchFaqs()} className="mt-4 min-h-[44px]">
          Try Again
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            FAQ Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            {faqs.length} FAQ{faqs.length !== 1 ? "s" : ""} total
            {searchDebounce && (
              <span className="ml-1">
                — searching &quot;{searchDebounce}&quot;
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search FAQs..."
              className="pl-9 min-h-[44px] w-48 sm:w-64"
              aria-label="Search FAQs"
            />
          </div>

          {/* Add button */}
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="min-h-[44px] min-w-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline">Add FAQ</span>
          </Button>
        </div>
      </div>

      {/* Add New FAQ Form */}
      {showAddForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              New FAQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-faq-question">Question</Label>
              <Input
                id="new-faq-question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Enter the frequently asked question"
                className="min-h-[44px]"
                disabled={isAdding}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-faq-answer">Answer</Label>
              <Textarea
                id="new-faq-answer"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Enter the answer"
                rows={3}
                className="min-h-[44px]"
                disabled={isAdding}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewQuestion("");
                  setNewAnswer("");
                }}
                disabled={isAdding}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isAdding || !newQuestion.trim() || !newAnswer.trim()}
                className="min-h-[44px]"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create FAQ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {faqs.length === 0 && !searchDebounce && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <HelpCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No FAQs yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first FAQ to get started
          </p>
        </div>
      )}

      {/* No search results */}
      {faqs.length === 0 && searchDebounce && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No results found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No FAQs match &quot;{searchDebounce}&quot;
          </p>
        </div>
      )}

      {/* FAQ List */}
      <div className="max-h-[600px] overflow-y-auto space-y-2">
        {faqs.map((faq, index) => (
          <Card
            key={faq.id}
            className={!faq.isActive ? "opacity-60" : ""}
          >
            <CardContent className="p-4">
              {editingId === faq.id ? (
                /* ── Edit mode ─────────────────────────────────────── */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Question</Label>
                    <Input
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="min-h-[44px]"
                      disabled={isUpdating}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Answer</Label>
                    <Textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      rows={3}
                      className="min-h-[44px]"
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={isUpdating}
                      className="min-h-[44px]"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveEdit}
                      disabled={
                        isUpdating ||
                        !editQuestion.trim() ||
                        !editAnswer.trim()
                      }
                      className="min-h-[44px]"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Display mode ──────────────────────────────────── */
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        #{index + 1}
                      </span>
                      {!faq.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium mt-1 text-sm">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Reorder */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(faq, "up")}
                      disabled={index === 0 || reorderingId === faq.id}
                      className="min-h-[44px] min-w-[36px] p-2"
                      aria-label={`Move FAQ "${faq.question}" up`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(faq, "down")}
                      disabled={
                        index === faqs.length - 1 || reorderingId === faq.id
                      }
                      className="min-h-[44px] min-w-[36px] p-2"
                      aria-label={`Move FAQ "${faq.question}" down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    {/* Toggle active */}
                    <Switch
                      checked={faq.isActive}
                      onCheckedChange={() => handleToggleActive(faq)}
                      disabled={togglingId === faq.id}
                      aria-label={`Toggle active for "${faq.question}"`}
                      className="mx-1"
                    />

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(faq)}
                      className="min-h-[44px] min-w-[36px] p-2"
                      aria-label={`Edit FAQ "${faq.question}"`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(faq)}
                      className="min-h-[44px] min-w-[36px] p-2 text-destructive hover:text-destructive"
                      aria-label={`Delete FAQ "${faq.question}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.question}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="min-h-[44px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}