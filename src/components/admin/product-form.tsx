"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  X,
  ImagePlus,
  AlertCircle,
  ChevronDown,
  Tag,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Tag {
  id: number;
  name: string;
}

interface ProductFormProps {
  productId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ productId, onSuccess, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Images
  const [primaryImage, setPrimaryImage] = useState<string | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Tags selection
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  // Slug auto-generate tracking
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Upload a single image
  const uploadImage = useCallback(async (file: File): Promise<{ galleryUrl: string; thumbnailUrl: string } | null> => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload/image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      return await res.json();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
      return null;
    }
  }, []);

  // Fetch categories and tags on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setTags(tagData.tags || []);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch product data if editing
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        const p = data.product;

        setName(p.name || "");
        setSlug(p.slug || "");
        setDescription(p.description || "");
        setPrice(String(p.price || ""));
        setCategoryId(String(p.categoryId || ""));
        setSeoTitle(p.seoTitle || "");
        setSeoDescription(p.seoDescription || "");
        setIsPublished(p.isPublished || false);
        setSlugManuallyEdited(true); // Don't auto-regenerate slug when editing

        // Images
        if (p.primaryImage) {
          setPrimaryImage(p.primaryImage);
          setPrimaryPreview(p.primaryImage);
        }

        // Gallery images - stored as JSON string
        if (p.galleryImages) {
          try {
            const parsed = typeof p.galleryImages === "string"
              ? JSON.parse(p.galleryImages)
              : p.galleryImages;
            if (Array.isArray(parsed)) {
              setGalleryImages(parsed);
              setGalleryPreviews(parsed);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // Tags
        if (data.tags && Array.isArray(data.tags)) {
          setSelectedTagIds(data.tags.map((t: Tag) => t.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  // Primary image handling
  const handlePrimaryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setPrimaryFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrimaryPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Gallery images handling
  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 10 - galleryPreviews.length;
    if (remaining <= 0) {
      toast.error("Maximum 10 gallery images allowed");
      return;
    }

    const validFiles = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);

    if (validFiles.length < files.length) {
      toast.error("Some files were skipped — only image files are allowed");
    }

    setGalleryFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validate = (): string | null => {
    if (!name.trim()) return "Product name is required";
    if (name.trim().length < 2) return "Product name must be at least 2 characters";
    if (!slug.trim()) return "Slug is required";
    if (!price || isNaN(Number(price)) || Number(price) <= 0) return "Valid price is required";
    if (!categoryId) return "Category is required";
    return null;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload primary image if new file selected
      let finalPrimaryImage = primaryImage;
      if (primaryFile) {
        const result = await uploadImage(primaryFile);
        if (result) {
          finalPrimaryImage = result.galleryUrl;
        }
      }

      // Upload gallery images
      const finalGalleryImages = [...galleryImages];
      for (const file of galleryFiles) {
        const result = await uploadImage(file);
        if (result) {
          finalGalleryImages.push(result.galleryUrl);
        }
      }

      // Build payload
      const payload: Record<string, unknown> = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
        price: Number(price),
        categoryId: Number(categoryId),
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        isPublished,
        primaryImage: finalPrimaryImage || null,
        galleryImages: JSON.stringify(finalGalleryImages),
        tagIds: selectedTagIds,
      };

      const url = productId
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = productId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to ${productId ? "update" : "create"} product`);
      }

      toast.success(data.message || `Product ${productId ? "updated" : "created"} successfully`);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tag toggle
  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));

  if (isLoading && productId) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Name *</Label>
          <Input
            id="product-name"
            placeholder="Product name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-slug">Slug *</Label>
          <Input
            id="product-slug"
            placeholder="product-slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="product-description">Description</Label>
          <Textarea
            id="product-description"
            placeholder="Product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-price">Price (₹) *</Label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-category">Category *</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* SEO */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">SEO</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo-title">SEO Title</Label>
            <Input
              id="seo-title"
              placeholder="SEO title (optional)"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-description">SEO Description</Label>
            <Input
              id="seo-description"
              placeholder="SEO description (optional)"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Primary Image */}
      <div className="space-y-3">
        <Label>Primary Image</Label>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {primaryPreview ? (
            <div className="relative group">
              <div className="h-32 w-32 rounded-md overflow-hidden border bg-muted">
                <img
                  src={primaryPreview}
                  alt="Primary preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  setPrimaryPreview(null);
                  setPrimaryFile(null);
                  setPrimaryImage(null);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 w-32 rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <span className="text-xs text-muted-foreground">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePrimaryFileChange}
                disabled={isSubmitting}
              />
            </label>
          )}
          <p className="text-xs text-muted-foreground sm:self-center">
            Click to upload. JPG, PNG, or WebP recommended.
          </p>
        </div>
      </div>

      <Separator />

      {/* Gallery Images */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Gallery Images ({galleryPreviews.length}/10)</Label>
          <label className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || galleryPreviews.length >= 10}
              className="min-h-[44px]"
              asChild
            >
              <span>
                <ImagePlus className="h-4 w-4 mr-2" />
                Add Images
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryFilesChange}
              disabled={isSubmitting || galleryPreviews.length >= 10}
            />
          </label>
        </div>
        {galleryPreviews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {galleryPreviews.map((src, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                  <img
                    src={src}
                    alt={`Gallery ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeGalleryImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-3">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="cursor-pointer px-3 py-1.5 min-h-[32px]"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
              <X className="ml-1.5 h-3 w-3" />
            </Badge>
          ))}
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[44px]"
              >
                <Tag className="h-4 w-4 mr-2" />
                Select Tags
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tags available</p>
                  )}
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 cursor-pointer min-h-[44px] px-2 py-1 rounded-md hover:bg-accent"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator />

      {/* Published Toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="product-published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
          disabled={isSubmitting}
        />
        <Label htmlFor="product-published" className="cursor-pointer">
          Publish immediately
        </Label>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {productId ? "Updating..." : "Creating..."}
            </>
          ) : productId ? (
            "Update Product"
          ) : (
            "Create Product"
          )}
        </Button>
      </div>
    </form>
  );
}