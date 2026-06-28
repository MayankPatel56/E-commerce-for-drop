"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Tag,
} from "lucide-react";

interface TagItem {
  id: number;
  name: string;
  _count: { products: number };
}

export function TagsManager() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add new
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tags");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Tag name is required");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create tag");
      }

      toast.success(data.message || "Tag created successfully");
      setNewName("");
      fetchTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Tag name is required");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/tags/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update tag");
      }

      toast.success(data.message || "Tag updated successfully");
      setEditingId(null);
      fetchTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update tag");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to delete tag");
      }

      toast.success(data.message || "Tag deleted successfully");
      setDeletingId(null);
      fetchTags();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tag");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Tags</h2>
          <p className="text-sm text-muted-foreground">
            {tags.length} tag{tags.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Inline Add */}
        <div className="flex gap-2">
          <Input
            placeholder="New tag name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleAddKeyDown}
            disabled={isAdding}
            className="max-w-[200px] min-h-[44px]"
          />
          <Button
            onClick={handleAdd}
            disabled={isAdding || !newName.trim()}
            className="min-h-[44px] min-w-[44px]"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            <span className="sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!error && tags.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No tags yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first tag above
          </p>
        </div>
      )}

      {/* Table */}
      {tags.length > 0 && (
        <div className="max-h-96 md:max-h-none overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="w-[100px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    {editingId === tag.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          disabled={isUpdating}
                          className="min-h-[36px] h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveEdit}
                          disabled={isUpdating}
                          className="min-h-[36px] min-w-[36px] p-1 text-primary hover:text-primary"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isUpdating}
                          className="min-h-[36px] min-w-[36px] p-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm font-medium">
                          {tag.name}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {tag._count.products}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editingId !== tag.id && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(tag)}
                          className="min-h-[44px] min-w-[36px] p-2"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(tag.id)}
                          className="min-h-[44px] min-w-[36px] p-2 text-destructive hover:text-destructive"
                        >
                          {deletingId === tag.id && isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}