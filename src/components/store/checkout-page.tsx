"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Package,
  MapPin,
  AlertCircle,
  Truck,
  CreditCard,
  CheckCircle,
  ChevronRight,
  User,
  Phone,
  Mail,
  Home,
  Building2,
  MapPinIcon,
  IndianRupee,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
import { Badge } from "@/components/ui/badge";

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

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

      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
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
        const firstError = document.querySelector('[aria-invalid="true"]');
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
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
          if (res.status === 400 && data.details) {
            const apiErrors: FieldErrors = {};
            const details = data.details as Record<string, string[]>;

            const fieldMap: Record<string, keyof FieldErrors> = {
              name: "name",
              phone: "phone",
              street: "street",
              city: "city",
              state: "state",
              pincode: "pincode",
              email: "email",
            };

            if (details.address && typeof details.address === "object" && !Array.isArray(details.address)) {
              const addrDetails = details.address as Record<string, string[]>;
              for (const [key, messages] of Object.entries(addrDetails)) {
                if (fieldMap[key]) {
                  apiErrors[fieldMap[key]] = messages[0];
                }
              }
            }

            for (const [key, messages] of Object.entries(details)) {
              if (key === "address" || key === "cart" || key === "consent") continue;
              if (fieldMap[key] && messages.length > 0) {
                apiErrors[fieldMap[key]] = messages[0];
              }
            }

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-6 py-16">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
              <ShoppingBag className="size-20 text-muted-foreground/30 relative" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-semibold">Your cart is empty</p>
              <p className="text-muted-foreground">
                Looks like you haven't added any items yet.
              </p>
            </div>
            <Button
              variant="default"
              className="min-h-[48px] px-8 rounded-full shadow-lg shadow-primary/20"
              onClick={() => onNavigate("home")}
            >
              <ArrowLeft className="size-4 mr-2" />
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Render: Main Checkout ───────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
    >
      <Button
        variant="ghost"
        className="mb-6 min-h-[44px] gap-2 px-2 text-muted-foreground hover:text-foreground -ml-2 group"
        onClick={() => onNavigate("home")}
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
        Back to Cart
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
          <span>Checkout</span>
          <Badge variant="secondary" className="text-sm font-normal">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete your order with cash on delivery
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8 items-start">
        {/* ── Left Column: Order Summary ── */}
        <div className="lg:sticky lg:top-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="size-5 text-primary" />
                Order Summary
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{totalItems} {totalItems === 1 ? "item" : "items"}</span>
                <span className="text-muted-foreground/30">|</span>
                <span className="text-primary font-medium">{formatPrice(cartTotal)}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-0 pt-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {items.map((item, index) => (
                  <React.Fragment key={item.variantId}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-2 rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div className="relative">
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="size-16 shrink-0 rounded-xl object-cover border shadow-sm"
                        />
                        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                          {item.quantity}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight line-clamp-2 text-sm">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.variantDescription}
                        </p>
                        <p className="text-xs font-medium text-primary mt-0.5">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>

                      <p className="font-semibold text-sm shrink-0 tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </motion.div>

                    {index < items.length - 1 && <Separator className="my-2" />}
                  </React.Fragment>
                ))}
              </div>

              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              {codLoading && (
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {!codLoading && codSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl"
                >
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  <span>
                    Pay on Delivery · Orders {formatPrice(codSettings.cod_min)}–{formatPrice(codSettings.cod_max)}
                  </span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Checkout Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="size-5 text-primary" />
                Delivery Details
              </CardTitle>
              <CardDescription>
                Enter your shipping address and contact information
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <AnimatePresence>
                {!codLoading && codOutOfRange && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" className="mb-6 rounded-xl">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Cash on Delivery Unavailable</AlertTitle>
                      <AlertDescription>
                        {codOutOfRange.type === "below"
                          ? `COD available for orders above ${formatPrice(codOutOfRange.min)}`
                          : `COD available for orders up to ${formatPrice(codOutOfRange.max)}`}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" className="mb-6 rounded-xl">
                      <AlertCircle className="size-4" />
                      <AlertTitle>Order Failed</AlertTitle>
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {codLoading ? (
                <div className="space-y-5">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-11 w-full" />
                    </div>
                  ))}
                  <Skeleton className="h-12 w-full mt-4 rounded-xl" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                      <User className="size-3.5 text-muted-foreground" />
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      onFocus={() => handleFocus("name")}
                      aria-invalid={touched.name && !!fieldErrors.name}
                      className={`min-h-[48px] rounded-xl transition-all ${
                        touched.name && !fieldErrors.name && formData.name
                          ? "border-green-500 focus:border-green-500"
                          : ""
                      } ${
                        touched.name && fieldErrors.name
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                    />
                    {touched.name && fieldErrors.name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3.5" />
                        {fieldErrors.name}
                      </p>
                    )}
                    {touched.name && !fieldErrors.name && formData.name && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="size-3.5" />
                        Looks good
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="size-3.5 text-muted-foreground" />
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                        handleFieldChange("phone", val);
                      }}
                      onBlur={() => handleBlur("phone")}
                      onFocus={() => handleFocus("phone")}
                      aria-invalid={touched.phone && !!fieldErrors.phone}
                      className={`min-h-[48px] rounded-xl transition-all ${
                        touched.phone && !fieldErrors.phone && formData.phone
                          ? "border-green-500 focus:border-green-500"
                          : ""
                      } ${
                        touched.phone && fieldErrors.phone
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                      inputMode="numeric"
                    />
                    {touched.phone && fieldErrors.phone && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3.5" />
                        {fieldErrors.phone}
                      </p>
                    )}
                    {touched.phone && !fieldErrors.phone && formData.phone && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="size-3.5" />
                        Valid phone number
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street" className="flex items-center gap-2 text-sm font-medium">
                      <Home className="size-3.5 text-muted-foreground" />
                      Street Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder="House no., building, street"
                      value={formData.street}
                      onChange={(e) => handleFieldChange("street", e.target.value)}
                      onBlur={() => handleBlur("street")}
                      onFocus={() => handleFocus("street")}
                      aria-invalid={touched.street && !!fieldErrors.street}
                      className={`min-h-[48px] rounded-xl transition-all ${
                        touched.street && !fieldErrors.street && formData.street
                          ? "border-green-500 focus:border-green-500"
                          : ""
                      } ${
                        touched.street && fieldErrors.street
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                    />
                    {touched.street && fieldErrors.street && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3.5" />
                        {fieldErrors.street}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        onBlur={() => handleBlur("city")}
                        onFocus={() => handleFocus("city")}
                        aria-invalid={touched.city && !!fieldErrors.city}
                        className={`min-h-[48px] rounded-xl transition-all ${
                          touched.city && !fieldErrors.city && formData.city
                            ? "border-green-500 focus:border-green-500"
                            : ""
                        } ${
                          touched.city && fieldErrors.city
                            ? "border-destructive focus:border-destructive"
                            : ""
                        }`}
                      />
                      {touched.city && fieldErrors.city && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3.5" />
                          {fieldErrors.city}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="flex items-center gap-2 text-sm font-medium">
                        <MapPinIcon className="size-3.5 text-muted-foreground" />
                        State <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => handleFieldChange("state", e.target.value)}
                        onBlur={() => handleBlur("state")}
                        onFocus={() => handleFocus("state")}
                        aria-invalid={touched.state && !!fieldErrors.state}
                        className={`min-h-[48px] rounded-xl transition-all ${
                          touched.state && !fieldErrors.state && formData.state
                            ? "border-green-500 focus:border-green-500"
                            : ""
                        } ${
                          touched.state && fieldErrors.state
                            ? "border-destructive focus:border-destructive"
                            : ""
                        }`}
                      />
                      {touched.state && fieldErrors.state && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="size-3.5" />
                          {fieldErrors.state}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode" className="flex items-center gap-2 text-sm font-medium">
                      <IndianRupee className="size-3.5 text-muted-foreground" />
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
                      onFocus={() => handleFocus("pincode")}
                      aria-invalid={touched.pincode && !!fieldErrors.pincode}
                      className={`min-h-[48px] rounded-xl transition-all ${
                        touched.pincode && !fieldErrors.pincode && formData.pincode
                          ? "border-green-500 focus:border-green-500"
                          : ""
                      } ${
                        touched.pincode && fieldErrors.pincode
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                      inputMode="numeric"
                    />
                    {touched.pincode && fieldErrors.pincode && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3.5" />
                        {fieldErrors.pincode}
                      </p>
                    )}
                    {touched.pincode && !fieldErrors.pincode && formData.pincode && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="size-3.5" />
                        Valid pincode
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="size-3.5 text-muted-foreground" />
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      onFocus={() => handleFocus("email")}
                      aria-invalid={touched.email && !!fieldErrors.email}
                      className={`min-h-[48px] rounded-xl transition-all ${
                        touched.email && !fieldErrors.email && formData.email
                          ? "border-green-500 focus:border-green-500"
                          : ""
                      } ${
                        touched.email && fieldErrors.email
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                    />
                    {touched.email && fieldErrors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3.5" />
                        {fieldErrors.email}
                      </p>
                    )}
                    {touched.email && !fieldErrors.email && formData.email && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="size-3.5" />
                        Valid email
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-3 pt-2 p-4 bg-muted/20 rounded-xl">
                    <Checkbox
                      id="consent"
                      checked={formData.consent}
                      onCheckedChange={(checked) =>
                        handleFieldChange("consent", checked === true)
                      }
                      className="mt-0.5 size-5"
                    />
                    <Label
                      htmlFor="consent"
                      className="text-sm font-normal leading-relaxed text-muted-foreground cursor-pointer"
                    >
                      I agree to receive marketing communications from Indicore Originals
                    </Label>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full min-h-[52px] text-base font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
                      size="lg"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-5 animate-spin mr-2" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-5 mr-2" />
                          Place Order · {formatPrice(cartTotal)}
                          <ChevronRight className="size-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="size-3.5" />
                        Free Delivery
                      </span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="size-3.5" />
                        COD Only
                      </span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="size-3.5" />
                        No Online Payment
                      </span>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}