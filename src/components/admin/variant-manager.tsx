"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, AlertCircle, Loader2 } from "lucide-react";

interface Variant {
  id: number;
  sku: string;
  variantType: string;
  variantValue: string;
  priceOverride: number | null;
  stockQuantity: number;
  isOutOfStock: boolean;
}

interface VariantManagerProps {
  productId: number;
  onVariantChange?: () => void;
}

type VariantType = "Size" | "Color" | "Material" | "Custom";

const VARIANT_TYPES: VariantType[] = ["Size", "Color", "Material", "Custom"];

export function VariantManager({ productId, onVariantChange }: VariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [formSku, setFormSku] = useState("");
  const [formType, setFormType] = useState<string>("");
  const [formValue, setFormValue] = useState("");
  const [formPriceOverride, setFormPriceOverride] = useState("");
  const [formStock, setFormStock] = useState("0");

  // Fetch variants from product detail API
  const fetchVariants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product variants");
      const data = await res.json();
      setVariants(data.variants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load variants");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const resetForm = () => {
    setFormSku("");
    setFormType("");
    setFormValue("");
    setFormPriceOverride("");
    setFormStock("0");
    setEditingVariant(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (variant: Variant) => {
    setEditingVariant(variant);
    setFormSku(variant.sku);
    setFormType(variant.variantType);
    setFormValue(variant.variantValue);
    setFormPriceOverride(variant.priceOverride ? String(variant.priceOverride) : "");
    setFormStock(String(variant.stockQuantity));
    setDialogOpen(true);
  };

  const validateForm = (): string | null => {
    if (!formSku.trim()) return "SKU is required";
    if (!formType) return "Variant type is required";
    if (!formValue.trim()) return "Variant value is required";
    if (formPriceOverride && (isNaN(Number(formPriceOverride)) || Number(formPriceOverride) < 0)) {
      return "Price override must be a valid positive number";
    }
    if (!formStock || isNaN(Number(formStock)) || Number(formStock) < 0) {
      return "Stock quantity must be a valid non-negative number";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sku: formSku.trim(),
        variantType: formType,
        variantValue: formValue.trim(),
        priceOverride: formPriceOverride ? Number(formPriceOverride) : null,
        stockQuantity: Number(formStock),
      };

      const url = editingVariant
        ? `/api/admin/products/${productId}/variants/${editingVariant.id}`
        : `/api/admin/products/${productId}/variants`;
      const method = editingVariant ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save variant");
      }

      toast.success(data.message || `Variant ${editingVariant ? "updated" : "added"} successfully`);
      setDialogOpen(false);
      resetForm();
      fetchVariants();
      onVariantChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to delete variant");
      }

      toast.success(data.message || "Variant deleted successfully");
      setDeleteTarget(null);
      fetchVariants();
      onVariantChange?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Variants ({variants.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={openAddDialog}
          className="min-h-11 min-w-11"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-25" />
              <Skeleton className="h-4 w-15" />
              <Skeleton className="h-4 w-15" />
              <Skeleton className="h-4 w-15" />
              <Skeleton className="h-4 w-15" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && variants.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No variants yet. Add one to get started.
        </p>
      )}

      {!isLoading && variants.length > 0 && (
        <div className="max-h-96 md:max-h-none overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Price Override</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-11">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {variant.variantType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{variant.variantValue}</TableCell>
                  <TableCell className="text-sm">
                    {variant.priceOverride ? `₹${variant.priceOverride.toLocaleString("en-IN")}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{variant.stockQuantity}</TableCell>
                  <TableCell>
                    <Badge
                      variant={variant.isOutOfStock ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {variant.isOutOfStock ? "Out of Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-11 min-w-11 p-2"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(variant)}
                          className="min-h-11 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(variant)}
                          className="min-h-11 text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Variant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVariant ? "Edit Variant" : "Add Variant"}
            </DialogTitle>
            <DialogDescription>
              {editingVariant
                ? "Update the variant details below."
                : "Fill in the details for the new variant."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="variant-sku">SKU *</Label>
              <Input
                id="variant-sku"
                placeholder="e.g., IND-TSHIRT-M-BLK"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Variant Type *</Label>
                <Select value={formType} onValueChange={setFormType} disabled={isSubmitting}>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-value">Value *</Label>
                <Input
                  id="variant-value"
                  placeholder="e.g., M or Black"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="variant-price">Price Override</Label>
                <Input
                  id="variant-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={formPriceOverride}
                  onChange={(e) => setFormPriceOverride(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variant-stock">Stock Quantity *</Label>
                <Input
                  id="variant-stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); resetForm(); }}
              disabled={isSubmitting}
              className="min-h-11"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="min-h-11">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingVariant ? (
                "Update Variant"
              ) : (
                "Add Variant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the variant &quot;{deleteTarget?.sku}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="min-h-11">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-h-11 bg-destructive text-white hover:bg-destructive/90"
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