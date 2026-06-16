"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  AlertCircle,
  Save,
  ShoppingCart,
  Store,
  Share2,
  Settings,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SettingsKV {
  [key: string]: unknown;
}

interface SettingField {
  key: string;
  label: string;
  type: "number" | "text" | "url";
  placeholder: string;
  description: string;
  jsonPath?: string;
}

// ─── Setting Groups ─────────────────────────────────────────────────────────

const ORDER_SETTINGS: SettingField[] = [
  {
    key: "cod_min_order",
    label: "COD Minimum Order (₹)",
    type: "number",
    placeholder: "299",
    description:
      "Minimum order amount required for Cash on Delivery. Orders below this amount cannot use COD.",
  },
  {
    key: "cod_max_order",
    label: "COD Maximum Order (₹)",
    type: "number",
    placeholder: "50000",
    description:
      "Maximum order amount allowed for Cash on Delivery. Orders above this amount cannot use COD.",
  },
];

const STORE_SETTINGS: SettingField[] = [
  {
    key: "store_name",
    label: "Store Name",
    type: "text",
    placeholder: "Indicore Originals",
    description: "Your store name displayed across the storefront and browser tab.",
  },
  {
    key: "store_email",
    label: "Store Email",
    type: "text",
    placeholder: "support@example.com",
    description: "Customer-facing contact email address.",
  },
  {
    key: "store_phone",
    label: "Store Phone",
    type: "text",
    placeholder: "+91XXXXXXXXXX",
    description: "Customer-facing phone number.",
  },
];

const SOCIAL_SETTINGS: SettingField[] = [
  {
    key: "social_links",
    label: "Instagram URL",
    type: "url",
    placeholder: "https://instagram.com/yourstore",
    description: "Your Instagram profile URL.",
    jsonPath: "instagram",
  },
  {
    key: "social_links",
    label: "Facebook URL",
    type: "url",
    placeholder: "https://facebook.com/yourstore",
    description: "Your Facebook page URL.",
    jsonPath: "facebook",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractValue(
  settings: SettingsKV,
  key: string,
  jsonPath?: string
): string {
  const raw = settings[key];
  if (raw === undefined || raw === null) return "";

  if (jsonPath) {
    const obj = raw as Record<string, string>;
    return obj[jsonPath] ?? "";
  }

  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const val = (raw as { value: unknown }).value;
    return val !== undefined && val !== null ? String(val) : "";
  }

  return String(raw);
}

// ─── Section Component ──────────────────────────────────────────────────────

interface SettingSectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  fields: SettingField[];
  settings: SettingsKV;
  isSavingKey: string | null;
  onSave: (key: string, value: unknown) => Promise<void>;
}

function SettingSection({
  title,
  icon,
  description,
  fields,
  settings,
  isSavingKey,
  onSave,
}: SettingSectionProps) {
  const groupedKeys = Array.from(new Set(fields.map((f) => f.key)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        {groupedKeys.map((groupKey) => {
          const groupFields = fields.filter((f) => f.key === groupKey);

          if (groupKey === "social_links") {
            return (
              <SocialLinksGroup
                key={groupKey}
                fields={groupFields}
                settings={settings}
                isSaving={isSavingKey === groupKey}
                onSave={onSave}
              />
            );
          }

          return groupFields.map((field) => (
            <SingleField
              key={field.key}
              field={field}
              settings={settings}
              isSaving={isSavingKey === field.key}
              onSave={onSave}
            />
          ));
        })}
      </CardContent>
    </Card>
  );
}

// ─── Single Field ───────────────────────────────────────────────────────────

function SingleField({
  field,
  settings,
  isSaving,
  onSave,
}: {
  field: SettingField;
  settings: SettingsKV;
  isSaving: boolean;
  onSave: (key: string, value: unknown) => Promise<void>;
}) {
  // Lazy initializer runs once per mount. Parent passes a `key` that changes
  // when settings reload, causing a remount with fresh values.
  const [localValue, setLocalValue] = useState(() =>
    extractValue(settings, field.key)
  );

  const handleSave = async () => {
    const trimmed = localValue.trim();
    let val: unknown;
    if (field.type === "number") {
      const num = parseFloat(trimmed);
      if (isNaN(num)) {
        toast.error(`${field.label} must be a valid number`);
        return;
      }
      val = { value: num };
    } else {
      val = { value: trimmed };
    }
    await onSave(field.key, val);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`setting-${field.key}`}>{field.label}</Label>
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            id={`setting-${field.key}`}
            type={field.type === "number" ? "number" : "text"}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={field.placeholder}
            disabled={isSaving}
            className="min-h-[44px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">
              {field.description}
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-h-[44px] min-w-[80px] shrink-0 mt-0"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Social Links Group ─────────────────────────────────────────────────────

function SocialLinksGroup({
  fields,
  settings,
  isSaving,
  onSave,
}: {
  fields: SettingField[];
  settings: SettingsKV;
  isSaving: boolean;
  onSave: (key: string, value: unknown) => Promise<void>;
}) {
  // Lazy initializer for both values on mount
  const [values, setValues] = useState(() => {
    const raw = settings["social_links"];
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, string>;
      return { instagram: obj.instagram ?? "", facebook: obj.facebook ?? "" };
    }
    return { instagram: "", facebook: "" };
  });

  const handleSave = async () => {
    const payload = {
      instagram: values.instagram.trim(),
      facebook: values.facebook.trim(),
    };
    await onSave("social_links", payload);
  };

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const jsonPath = field.jsonPath!;
        return (
          <div key={field.key + "-" + jsonPath} className="space-y-1.5">
            <Label htmlFor={`setting-${field.key}-${jsonPath}`}>
              {field.label}
            </Label>
            <Input
              id={`setting-${field.key}-${jsonPath}`}
              type="url"
              value={values[jsonPath as keyof typeof values]}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [jsonPath]: e.target.value,
                }))
              }
              placeholder={field.placeholder}
              disabled={isSaving}
              className="min-h-[44px]"
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">
                {field.description}
              </p>
            )}
          </div>
        );
      })}
      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-h-[44px] min-w-[80px]"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SettingsManager() {
  const [settings, setSettings] = useState<SettingsKV>({});
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data.settings || {});
      setSettingsVersion((v) => v + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load settings"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (key: string, value: unknown) => {
    setIsSavingKey(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save setting");
      }

      toast.success("Setting saved successfully");
      fetchSettings();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save setting"
      );
    } finally {
      setIsSavingKey(null);
    }
  };

  // Memoize section key to force remount on settings change
  const sectionsKey = useMemo(() => `v${settingsVersion}`, [settingsVersion]);

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
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
        <h3 className="text-lg font-medium">Failed to load settings</h3>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button onClick={fetchSettings} className="mt-4 min-h-[44px]">
          Try Again
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" key={sectionsKey}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Store Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage store configuration, order limits, and social media links
        </p>
      </div>

      {/* Order Settings */}
      <SettingSection
        title="Order Settings"
        icon={<ShoppingCart className="h-5 w-5" />}
        description="Cash on Delivery order amount limits"
        fields={ORDER_SETTINGS}
        settings={settings}
        isSavingKey={isSavingKey}
        onSave={handleSave}
      />

      {/* Store Information */}
      <SettingSection
        title="Store Information"
        icon={<Store className="h-5 w-5" />}
        description="Basic store details displayed to customers"
        fields={STORE_SETTINGS}
        settings={settings}
        isSavingKey={isSavingKey}
        onSave={handleSave}
      />

      {/* Social Links */}
      <SettingSection
        title="Social Links"
        icon={<Share2 className="h-5 w-5" />}
        description="Social media profile URLs for the storefront"
        fields={SOCIAL_SETTINGS}
        settings={settings}
        isSavingKey={isSavingKey}
        onSave={handleSave}
      />
    </div>
  );
}