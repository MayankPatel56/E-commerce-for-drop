import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// ─── GET: List customers with pagination and search ──────────────────────────

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Fetch customers and total count in parallel
    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          role: true,
          isRegistered: true,
          emailConsentGiven: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.customer.count({ where }),
    ]);

    const formatted = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      role: c.role,
      isRegistered: c.isRegistered,
      emailConsentGiven: c.emailConsentGiven,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      orderCount: c._count.orders,
    }));

    return NextResponse.json({
      customers: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/admin/customers error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}