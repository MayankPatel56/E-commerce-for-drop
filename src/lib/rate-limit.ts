import { db } from "@/lib/db";

/**
 * Database-based login rate limiting — no Redis/Upstash (Resolution #2)
 * Checks if an email is allowed to attempt login based on:
 * - Current lock status (locked_until)
 * - Number of failed attempts (login_attempts >= 5 → 15 min lock)
 */
export async function checkLoginRateLimit(email: string): Promise<{
  allowed: boolean;
  remainingMinutes: number;
}> {
  const customer = await db.customer.findUnique({
    where: { email },
  });

  if (!customer) {
    return { allowed: true, remainingMinutes: 0 };
  }

  // Check if currently locked
  if (customer.lockedUntil && customer.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (customer.lockedUntil.getTime() - Date.now()) / 60000
    );
    return { allowed: false, remainingMinutes };
  }

  // If locked_until has passed, reset attempts
  if (customer.lockedUntil && customer.lockedUntil <= new Date()) {
    await db.customer.update({
      where: { email },
      data: { loginAttempts: 0, lockedUntil: null },
    });
  }

  // Check if at the threshold
  if (customer.loginAttempts >= 5) {
    await db.customer.update({
      where: { email },
      data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
    });
    return { allowed: false, remainingMinutes: 15 };
  }

  return { allowed: true, remainingMinutes: 0 };
}

/**
 * Record a failed login attempt
 * Returns true if account is now locked
 */
export async function recordFailedLogin(email: string): Promise<boolean> {
  const customer = await db.customer.findUnique({
    where: { email },
  });

  if (!customer) return false;

  const newAttempts = customer.loginAttempts + 1;

  if (newAttempts >= 5) {
    await db.customer.update({
      where: { email },
      data: {
        loginAttempts: newAttempts,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    return true; // Account is now locked
  }

  await db.customer.update({
    where: { email },
    data: { loginAttempts: newAttempts },
  });

  return false;
}

/**
 * Reset login attempts on successful login
 */
export async function resetLoginAttempts(email: string): Promise<void> {
  await db.customer.update({
    where: { email },
    data: { loginAttempts: 0, lockedUntil: null },
  });
}

/**
 * Database-based order tracking rate limiting (Resolution #2)
 * 10 attempts per 15 minutes per IP
 */
export async function checkTrackingRateLimit(ip: string): Promise<{
  allowed: boolean;
}> {
  const TRACKING_LIMIT = 10;
  const TRACKING_WINDOW_MS = 15 * 60 * 1000;

  const windowStart = new Date(Date.now() - TRACKING_WINDOW_MS);

  // Cleanup expired entries
  await db.orderTrackAttempt.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const attemptCount = await db.orderTrackAttempt.count({
    where: {
      ipAddress: ip,
      attemptTime: { gte: windowStart },
    },
  });

  if (attemptCount >= TRACKING_LIMIT) {
    return { allowed: false };
  }

  await db.orderTrackAttempt.create({
    data: {
      ipAddress: ip,
      attemptTime: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return { allowed: true };
}