'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface CustomerProfileData {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: Address | null;
  isRegistered: boolean;
  emailConsentGiven: boolean;
  createdAt: string;
}

interface CustomerProfileProps {
  onProfileUpdated?: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const PHONE_REGEX = /^[0-9]{10}$/;

export function CustomerProfile({ onProfileUpdated }: CustomerProfileProps) {
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [withdrawingConsent, setWithdrawingConsent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [hasAddress, setHasAddress] = useState(false);
  const [emailConsentGiven, setEmailConsentGiven] = useState(false);
  const [email, setEmail] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/customer/profile');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Failed to fetch profile (status ${res.status})`);
      }
      const data: CustomerProfileData = await res.json();
      setProfile(data);
      setEmail(data.email);
      setName(data.name);
      setPhone(data.phone);
      setEmailConsentGiven(data.emailConsentGiven);
      if (data.address) {
        setHasAddress(true);
        setStreet(data.address.street);
        setCity(data.address.city);
        setState(data.address.state);
        setPincode(data.address.pincode);
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!name || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!PHONE_REGEX.test(phone)) {
      newErrors.phone = 'Phone must be a 10-digit number';
    }

    // Validate address only if any address field is filled
    const anyAddressField = street || city || state || pincode;
    if (anyAddressField) {
      if (!street.trim()) {
        newErrors.street = 'Street is required';
      }
      if (!city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!PINCODE_REGEX.test(pincode)) {
        newErrors.pincode = 'Enter a valid 6-digit pincode';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, phone, street, city, state, pincode]);

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setSuccessMessage(null);
    try {
      const anyAddressField = street || city || state || pincode;
      const body: {
        name?: string;
        phone?: string;
        address?: { street: string; city: string; state: string; pincode: string };
      } = {
        name: name.trim(),
        phone: phone.trim(),
      };

      if (anyAddressField) {
        body.address = {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        };
      }

      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Failed to save profile (status ${res.status})`);
      }

      setSuccessMessage('Profile updated successfully');
      setErrors({});
      onProfileUpdated?.();
    } catch (err) {
      setSuccessMessage(null);
      setErrors((prev) => ({
        ...prev,
        _form: err instanceof Error ? err.message : 'Failed to save profile',
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawConsent = async () => {
    setWithdrawingConsent(true);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawConsent: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || `Failed to withdraw consent (status ${res.status})`
        );
      }

      setEmailConsentGiven(false);
      setSuccessMessage('Marketing consent withdrawn');
      onProfileUpdated?.();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        _consent: err instanceof Error ? err.message : 'Failed to withdraw consent',
      }));
    } finally {
      setWithdrawingConsent(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Separator />
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Fetch error ───────────────────────────────────────────────────
  if (fetchError) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ── Form error (form-level) ───────────────────────────────────────
  const formError = (errors as Record<string, string | undefined>)._form;
  const consentError = (errors as Record<string, string | undefined>)._consent;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          My Profile
        </CardTitle>
        <CardDescription>
          Manage your account details for Indicore Originals
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Success message ─────────────────────────────────────── */}
        {successMessage && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* ── Form-level error ────────────────────────────────────── */}
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* ── Personal Information ────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="profile-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-name"
                placeholder="Full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`min-h-[44px] ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="profile-phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-phone"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setPhone(val);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                className={errors.phone ? 'border-destructive' : ''}
                inputMode="numeric"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email (account identifier)</Label>
            <Input
              id="profile-email"
              value={email}
              readOnly
              className="bg-muted cursor-not-allowed text-muted-foreground"
              tabIndex={-1}
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>
        </div>

        <Separator />

        {/* ── Address Section ─────────────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Address
          </h3>
          <p className="text-sm text-muted-foreground">
            Fill in your address details. All fields are required if you provide an address.
          </p>

          {/* Street (full width) */}
          <div className="space-y-2">
            <Label htmlFor="profile-street">
              Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-street"
              placeholder="House/flat no., building, street"
              value={street}
              onChange={(e) => {
                setStreet(e.target.value);
                if (errors.street) setErrors((prev) => ({ ...prev, street: undefined }));
              }}
              className={errors.street ? 'border-destructive' : ''}
            />
            {errors.street && (
              <p className="text-sm text-destructive">{errors.street}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="profile-city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-city"
                placeholder="City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: undefined }));
                }}
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="profile-state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-state"
                placeholder="State"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  if (errors.state) setErrors((prev) => ({ ...prev, state: undefined }));
                }}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>
          </div>

          {/* Pincode */}
          <div className="space-y-2 sm:max-w-xs">
            <Label htmlFor="profile-pincode">
              Pincode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-pincode"
              placeholder="6-digit pincode"
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setPincode(val);
                if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: undefined }));
              }}
              className={errors.pincode ? 'border-destructive' : ''}
              inputMode="numeric"
            />
            {errors.pincode && (
              <p className="text-sm text-destructive">{errors.pincode}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Email Consent ───────────────────────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Email Preferences
          </h3>

          {emailConsentGiven ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have given consent to receive marketing emails from Indicore Originals.
              </p>
              {consentError && (
                <p className="text-sm text-destructive">{consentError}</p>
              )}
              <Button
                variant="outline"
                className="min-h-[44px] text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleWithdrawConsent}
                disabled={withdrawingConsent}
              >
                {withdrawingConsent ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Withdraw Marketing Consent
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Marketing consent is not currently given. You are not receiving promotional emails
              from Indicore Originals.
            </p>
          )}

          {!emailConsentGiven && !profile?.emailConsentGiven && (
            <p className="text-xs text-muted-foreground">
              Marketing consent was previously withdrawn.
            </p>
          )}
        </div>

        <Separator />

        {/* ── Save Button ─────────────────────────────────────────── */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-h-[44px] min-w-[140px] px-6"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}