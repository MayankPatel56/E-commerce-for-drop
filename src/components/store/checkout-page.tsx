"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Package,
  MapPin,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { useCart } from "@/context/cart-context";
import Image from "next/image";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CheckoutPageProps {
  onOrderSuccess: (orderNumber: string) => void;
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

interface FormData {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  email: string;
  consent: boolean;
}

interface FieldErrors {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email?: string;
}

interface CodSettings {
  cod_min: number;
  cod_max: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

const PHONE_REGEX = /^[0-9]{10}$/;
const PINCODE_REGEX = /^[0-9]{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name: keyof FieldErrors, value: string): string | undefined {
  switch (name) {
    case "name":
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      return undefined;
    case "phone":
      if (!value.trim()) return "Phone number is required";
      if (!PHONE_REGEX.test(value.trim()))
        return "Enter a valid 10-digit phone number";
      return undefined;
    case "street":
      if (!value.trim()) return "Street address is required";
      return undefined;
    case "city":
      if (!value.trim()) return "City is required";
      return undefined;
    case "state":
      if (!value.trim()) return "State is required";
      return undefined;
    case "pincode":
      if (!value.trim()) return "Pincode is required";
      if (!PINCODE_REGEX.test(value.trim()))
        return "Pincode must be a 6-digit number";
      return undefined;
    case "email":
      if (!value.trim()) return "Email is required";
      if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address";
      return undefined;
    default:
      return undefined;
  }
}

function validateForm(formData: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const fields: (keyof FieldErrors)[] = [
    "name",
    "phone",
    "street",
    "city",
    "state",
    "pincode",
    "email",
  ];
  for (const field of fields) {
    const error = validateField(field, formData[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CheckoutPage({ onOrderSuccess, onNavigate }: CheckoutPageProps) {
  const { items, cartTotal, totalItems, clearCart } = useCart();

  // COD settings state
  const [codSettings, setCodSettings] = useState<CodSettings | null>(null);
  const [codLoading, setCodLoading] = useState(true);
  const [codFetchError, setCodFetchError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    email: "",
    consent: false,
  });

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Fetch COD Settings ─────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchCodSettings() {
      try {
        const res = await fetch("/api/checkout/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data: CodSettings = await res.json();
        if (!cancelled) {
          setCodSettings(data);
          setCodLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCodFetchError("Could not load checkout settings. Please refresh the page.");
          setCodLoading(false);
        }
      }
    }

    fetchCodSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── COD Range Check ─────────────────────────────────────────────────────

  const codOutOfRange = useMemo(() => {
    if (!codSettings) return null;
    if (cartTotal < codSettings.cod_min) {
      return { type: "below" as const, min: codSettings.cod_min, max: codSettings.cod_max };
    }
    if (cartTotal > codSettings.cod_max) {
      return { type: "above" as const, min: codSettings.cod_min, max: codSettings.cod_max };
    }
    return null;
  }, [codSettings, cartTotal]);

  // ─── Form Handlers ──────────────────────────────────────────────────────

  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Live-validate if field has been touched
      if (touched[field]) {
        const error =
          typeof value === "string"
            ? validateField(field as keyof FieldErrors, value)
            : undefined;
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched]
  );

  const handleBlur = useCallback(
    (field: keyof FieldErrors) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, formData[field]);
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    },
    [formData]
  );

  // ─── Form Validity ──────────────────────────────────────────────────────

  const isFormValid = useMemo(() => {
    const errors = validateForm(formData);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const canSubmit = isFormValid && !codOutOfRange && !submitting && !codLoading && items.length > 0;

  // ─── Submit Handler ──────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      // Validate all fields
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        // Mark all fields as touched
        setTouched({
          name: true,
          phone: true,
          street: true,
          city: true,
          state: true,
          pincode: true,
          email: true,
        });
        setFieldErrors(errors);
        return;
      }

      if (codOutOfRange) return;

      setSubmitting(true);

      try {
        const body = {
          email: formData.email.trim(),
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: {
            street: formData.street.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
          },
          cart: items.map((item) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
          consent: formData.consent,
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          // Handle 400 validation errors with field-level details
          if (res.status === 400 && data.details) {
            const apiErrors: FieldErrors = {};
            const details = data.details as Record<string, string[]>;

            // Map API field names to form field names
            const fieldMap: Record<string, keyof FieldErrors> = {
              name: "name",
              phone: "phone",
              street: "street",
              city: "city",
              state: "state",
              pincode: "pincode",
              email: "email",
            };

            // Check address sub-fields
            if (details.address) {
              // details.address could be an object with nested field errors
              if (typeof details.address === "object" && !Array.isArray(details.address)) {
                const addrDetails = details.address as Record<string, string[]>;
                for (const [key, messages] of Object.entries(addrDetails)) {
                  if (fieldMap[key]) {
                    apiErrors[fieldMap[key]] = messages[0];
                  }
                }
              }
            }

            // Check top-level fields
            for (const [key, messages] of Object.entries(details)) {
              if (key === "address" || key === "cart" || key === "consent") continue;
              if (fieldMap[key] && messages.length > 0) {
                apiErrors[fieldMap[key]] = messages[0];
              }
            }

            // Also check for address.street, address.city etc. (flattened Zod errors)
            for (const key of Object.keys(details)) {
              if (key.startsWith("address.") && details[key] != null) {
                const subField = key.replace("address.", "");
                if (fieldMap[subField]) {
                  apiErrors[fieldMap[subField]] = (details[key] as string[])[0];
                }
              }
            }

            if (Object.keys(apiErrors).length > 0) {
              setFieldErrors(apiErrors);
              setTouched({
                name: true,
                phone: true,
                street: true,
                city: true,
                state: true,
                pincode: true,
                email: true,
              });
              setSubmitError(data.error || "Please fix the errors below.");
            } else {
              setSubmitError(data.error || "Validation failed. Please check your details.");
            }
          } else {
            setSubmitError(data.error || "Something went wrong. Please try again.");
          }
          return;
        }

        // Success — clear cart BEFORE redirecting (Resolution #10)
        clearCart();
        onOrderSuccess(data.orderNumber);
      } catch {
        setSubmitError("Network error. Please check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [formData, items, codOutOfRange, clearCart, onOrderSuccess]
  );

  // ─── Render: Empty Cart ──────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <Package className="size-16 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              Your cart is empty
            </p>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => onNavigate("home")}
            >
              <ArrowLeft className="size-4" />
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render: Main Checkout ───────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6 min-h-[44px] gap-2 px-2 text-muted-foreground hover:text-foreground -ml-2"
        onClick={() => onNavigate("home")}
      >
        <ArrowLeft className="size-4" />
        Back to Cart
      </Button>

      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 sm:mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8 items-start">
        {/* ── Left Column: Order Summary (sticky on desktop) ── */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="size-5" />
                Order Summary
              </CardTitle>
              <CardDescription>
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-0">
              {/* Cart Items */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <React.Fragment key={item.variantId}>
                    <div className="flex items-start gap-3">
                      {/* Thumbnail 64x64 */}
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        width={64}
                        height={64}
                        className="size-16 shrink-0 rounded-md object-cover"
                      />

                      {/* Product details */}
                      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                        <p className="font-medium leading-tight line-clamp-2 text-sm sm:text-base">
                          {item.productName}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                          {item.variantDescription}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} &times; {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Line total */}
                      <p className="font-medium text-sm sm:text-base shrink-0 tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {index < items.length - 1 && <Separator className="my-3" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Subtotal */}
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">Subtotal</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatPrice(cartTotal)}
                </span>
              </div>

              {/* COD Range Notice */}
              {codLoading && (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {!codLoading && codSettings && (
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 shrink-0" />
                  <span>
                    Pay on Delivery &middot; Orders {formatPrice(codSettings.cod_min)}&ndash;{formatPrice(codSettings.cod_max)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Checkout Form ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="size-5" />
              Delivery Details
            </CardTitle>
            <CardDescription>
              Enter your shipping address and contact information
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* COD Out of Range Error */}
            {!codLoading && codOutOfRange && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="size-4" />
                <AlertTitle>Cash on Delivery Unavailable</AlertTitle>
                <AlertDescription>
                  {codOutOfRange.type === "below"
                    ? `COD available for orders above ${formatPrice(codOutOfRange.min)}`
                    : `COD available for orders up to ${formatPrice(codOutOfRange.max)}`}
                </AlertDescription>
              </Alert>
            )}

            {/* Settings Fetch Error */}
            {codFetchError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="size-4" />
                <AlertTitle>Settings Error</AlertTitle>
                <AlertDescription>{codFetchError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Error */}
            {submitError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="size-4" />
                <AlertTitle>Order Failed</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Loading Skeleton (COD settings fetching) */}
            {codLoading ? (
              <div className="space-y-5">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
                <Skeleton className="h-11 w-full mt-4" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    aria-invalid={touched.name && !!fieldErrors.name}
                    aria-describedby={
                      touched.name && fieldErrors.name ? "name-error" : undefined
                    }
                    className="min-h-[44px]"
                  />
                  {touched.name && fieldErrors.name && (
                    <p id="name-error" className="text-sm text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => {
                      // Allow only digits, max 10
                      const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                      handleFieldChange("phone", val);
                    }}
                    onBlur={() => handleBlur("phone")}
                    aria-invalid={touched.phone && !!fieldErrors.phone}
                    aria-describedby={
                      touched.phone && fieldErrors.phone ? "phone-error" : undefined
                    }
                    className="min-h-[44px]"
                    inputMode="numeric"
                  />
                  {touched.phone && fieldErrors.phone && (
                    <p id="phone-error" className="text-sm text-destructive">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* Street Address */}
                <div className="space-y-2">
                  <Label htmlFor="street">
                    Street Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="street"
                    type="text"
                    placeholder="House no., building, street"
                    value={formData.street}
                    onChange={(e) => handleFieldChange("street", e.target.value)}
                    onBlur={() => handleBlur("street")}
                    aria-invalid={touched.street && !!fieldErrors.street}
                    aria-describedby={
                      touched.street && fieldErrors.street ? "street-error" : undefined
                    }
                    className="min-h-[44px]"
                  />
                  {touched.street && fieldErrors.street && (
                    <p id="street-error" className="text-sm text-destructive">
                      {fieldErrors.street}
                    </p>
                  )}
                </div>

                {/* City & State (side by side on sm+) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      onBlur={() => handleBlur("city")}
                      aria-invalid={touched.city && !!fieldErrors.city}
                      aria-describedby={
                        touched.city && fieldErrors.city ? "city-error" : undefined
                      }
                      className="min-h-[44px]"
                    />
                    {touched.city && fieldErrors.city && (
                      <p id="city-error" className="text-sm text-destructive">
                        {fieldErrors.city}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => handleFieldChange("state", e.target.value)}
                      onBlur={() => handleBlur("state")}
                      aria-invalid={touched.state && !!fieldErrors.state}
                      aria-describedby={
                        touched.state && fieldErrors.state ? "state-error" : undefined
                      }
                      className="min-h-[44px]"
                    />
                    {touched.state && fieldErrors.state && (
                      <p id="state-error" className="text-sm text-destructive">
                        {fieldErrors.state}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pincode */}
                <div className="space-y-2">
                  <Label htmlFor="pincode">
                    Pincode <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    type="text"
                    placeholder="6-digit pincode"
                    value={formData.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                      handleFieldChange("pincode", val);
                    }}
                    onBlur={() => handleBlur("pincode")}
                    aria-invalid={touched.pincode && !!fieldErrors.pincode}
                    aria-describedby={
                      touched.pincode && fieldErrors.pincode ? "pincode-error" : undefined
                    }
                    className="min-h-[44px]"
                    inputMode="numeric"
                  />
                  {touched.pincode && fieldErrors.pincode && (
                    <p id="pincode-error" className="text-sm text-destructive">
                      {fieldErrors.pincode}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address (For order updates) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    aria-invalid={touched.email && !!fieldErrors.email}
                    aria-describedby={
                      touched.email && fieldErrors.email ? "email-error" : undefined
                    }
                    className="min-h-[44px]"
                  />
                  {touched.email && fieldErrors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="consent"
                    checked={formData.consent}
                    onCheckedChange={(checked) =>
                      handleFieldChange("consent", checked === true)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="consent"
                    className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer"
                  >
                    I agree to receive marketing communications from Indicore
                    Originals
                  </Label>
                </div>

                <Separator className="my-6" />

                {/* Place Order Button */}
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full min-h-[44px] text-base font-semibold"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Place Order &middot; {formatPrice(cartTotal)}
                    </>
                  )}
                </Button>

                {/* COD Info */}
                <p className="text-center text-xs text-muted-foreground">
                  Cash on Delivery only &middot; No online payment required
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
