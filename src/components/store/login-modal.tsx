"use client";

import { useState, useCallback } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useStoreNavigate } from "@/hooks/useStoreNavigate";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  general?: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface LoginModalProps {
  onClose: () => void;
  initialView?: "login" | "signup";
}

export function LoginModal({ onClose, initialView = "login" }: LoginModalProps) {
  const router = useRouter();
  const navigate = useStoreNavigate();

  // Auth state
  const [appView, setAppView] = useState<"login" | "signup">(initialView);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // Shared UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; remainingMinutes: number } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Check session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user as UserInfo);
      }
    } catch {
      // Not authenticated
    }
  }, []);

  // Validation
  const validateLogin = (): boolean => {
    const errors: FormErrors = {};
    if (!loginEmail.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail))
      errors.email = "Enter a valid email address";
    if (!loginPassword) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignup = (): boolean => {
    const errors: FormErrors = {};
    if (!signupName.trim()) errors.name = "Name is required";
    else if (signupName.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!signupEmail.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail))
      errors.email = "Enter a valid email address";
    if (!signupPassword) errors.password = "Password is required";
    else if (signupPassword.length < 8) errors.password = "Password must be at least 8 characters";
    if (!signupPhone.trim()) errors.phone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(signupPhone.trim()))
      errors.phone = "Enter a valid 10-digit phone number";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setLockoutInfo(null);
    if (!validateLogin()) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        if (result.error.includes("ACCOUNT_LOCKED")) {
          const minutes = parseInt(result.error.split(":")[1]) || 15;
          setLockoutInfo({ locked: true, remainingMinutes: minutes });
          setGeneralError(
            `Account locked due to too many failed attempts. Please try again in ${minutes} minutes.`
          );
        } else {
          setGeneralError("Invalid email or password");
        }
      } else if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated && sessionData.user) {
          setUser(sessionData.user as UserInfo);
          onClose();
          if (sessionData.user.role === "admin") {
            navigate("admin");
          }
        }
      }
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validateSignup()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim().toLowerCase(),
          password: signupPassword,
          phone: signupPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeneralError(data.error || "Signup failed");
        return;
      }
      const result = await signIn("credentials", {
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        redirect: false,
      });
      if (result?.ok) {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData.authenticated) {
          setUser(sessionData.user as UserInfo);
        }
      }
      onClose();
      setLoginEmail(signupEmail);
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    navigate("home");
  };

  const switchView = (view: "login" | "signup") => {
    setAppView(view);
    setFormErrors({});
    setGeneralError(null);
    setLockoutInfo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onClose()}
      />
      <Card className="relative w-full max-w-md shadow-xl z-10">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {appView === "login" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {appView === "login"
              ? "Enter your credentials to access your account"
              : "Join Indicore Originals today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lockoutInfo?.locked && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}
          {generalError && !lockoutInfo?.locked && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}
          {appView === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isLoading || !!lockoutInfo?.locked}
                  autoComplete="email"
                  autoFocus
                />
                {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoading || !!lockoutInfo?.locked}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !!lockoutInfo?.locked}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : lockoutInfo?.locked ? (
                  `Locked — Try in ${lockoutInfo.remainingMinutes} min`
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Rahul Sharma"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  autoFocus
                />
                {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-phone">Phone Number</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="9876543210"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  disabled={isLoading}
                  autoComplete="tel"
                  maxLength={10}
                />
                {formErrors.phone && <p className="text-sm text-destructive">{formErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-sm text-destructive">{formErrors.password}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Separator />
          <p className="text-sm text-muted-foreground text-center">
            {appView === "login" ? (
              <>Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("signup")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </button></>
            ) : (
              <>Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </button></>
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}