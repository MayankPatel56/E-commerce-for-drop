import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Plan: §Phase 4 — Order Creation Transaction with Row-Level Locks
// Uses DIRECT_URL (non-PgBouncer) for FOR UPDATE support in transactions

// ─── Validation Schemas ──────────────────────────────────────────────────────

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"), // Resolution #8: state field required
  pincode: z
    .string()
    .min(1, "Pincode is required")
    .regex(/^[0-9]{6}$/, "Pincode must be a 6-digit number"),
});

const cartItemSchema = z.object({
  variant_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const createOrderSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),
  address: addressSchema,
  cart: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
  consent: z.boolean().optional().default(false), // Resolution #7: consent optional
});

// ─── Helper: Generate Order Number ──────────────────────────────────────────

function generateOrderNumber(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${timestamp}-${random}`;
}

// ─── POST /api/orders ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 400 }
      );
    }

    const { email, name, phone, address, cart, consent } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Get COD settings
    const settings = await db.setting.findMany({
      where: { key: { in: ["cod_min_order", "cod_max_order"] } },
    });

    let codMin = 0;
    let codMax = 50000;
    for (const s of settings) {
      const val = s.value as { value: number };
      if (s.key === "cod_min_order") codMin = val.value ?? 0;
      if (s.key === "cod_max_order") codMax = val.value ?? 50000;
    }

    // 3. Pre-fetch variants for initial validation (before transaction)
    // Plan: §Phase 4 — We do a light check here, then re-validate inside the transaction
    //       with row-level locks to prevent race conditions.
    const variantIds = cart.map((item) => item.variant_id);
    const preCheckVariants = await db.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: { select: { id: true, name: true, price: true, isPublished: true } },
      },
    });

    const preCheckMap = new Map(preCheckVariants.map((v) => [v.id, v]));

    // Quick pre-check: all variants exist and products are published
    for (const item of cart) {
      const variant = preCheckMap.get(item.variant_id);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant ID ${item.variant_id} not found` },
          { status: 400 }
        );
      }
      if (!variant.product.isPublished) {
        return NextResponse.json(
          { error: `${variant.product.name} is no longer available` },
          { status: 400 }
        );
      }
    }

    // 4. Calculate cart total (for COD validation, uses pre-check prices)
    let cartTotal = 0;
    for (const item of cart) {
      const variant = preCheckMap.get(item.variant_id)!;
      const unitPrice = variant.price ?? variant.product.price;
      cartTotal += unitPrice * item.quantity;
    }

    // 5. Validate COD range
    if (cartTotal < codMin) {
      return NextResponse.json(
        {
          error: `COD available for orders above ₹${codMin.toLocaleString("en-IN")}`,
        },
        { status: 400 }
      );
    }
    if (cartTotal > codMax) {
      return NextResponse.json(
        {
          error: `COD available for orders up to ₹${codMax.toLocaleString("en-IN")}`,
        },
        { status: 400 }
      );
    }

    // 6. Find or create customer (email unique, phone non-unique)
    // If user is authenticated, link order to existing customer
    const session = await getServerSession(authOptions);
    let customerId: string | null = null;

    // Check if customer already exists (by email)
    const existingCustomer = await db.customer.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingCustomer) {
      // Update existing customer's phone/name/address
      await db.customer.update({
        where: { id: existingCustomer.id },
        data: {
          phone,
          name,
          address: address,
          // If consent is true, update email consent
          ...(consent && !existingCustomer.emailConsentGiven
            ? { emailConsentGiven: true }
            : {}),
        },
      });
      customerId = existingCustomer.id;
    } else {
      // Create new guest customer (isRegistered = false)
      // Customer has 1:1 relation with User, so we create a minimal User record
      // with a placeholder password hash (guest cannot log in until they register)
      const guestUserId = crypto.randomUUID();
      const bcrypt = await import("bcryptjs");
      const placeholderHash = await bcrypt.hash(
        `guest_${Date.now()}_${Math.random().toString(36)}`,
        10
      );

      await db.user.create({
        data: {
          id: guestUserId,
          email: normalizedEmail,
          name,
          password: placeholderHash,
        },
      });

      const newCustomer = await db.customer.create({
        data: {
          id: guestUserId,
          email: normalizedEmail,
          name,
          phone,
          address: address,
          isRegistered: false,
          role: "customer",
          emailConsentGiven: consent ?? false,
        },
      });
      customerId = newCustomer.id;
    }

    // If authenticated user matches this email, ensure customerId matches
    if (session?.user?.email && session.user.email.toLowerCase() === normalizedEmail) {
      const authCustomer = await db.customer.findUnique({
        where: { email: session.user.email.toLowerCase() },
      });
      if (authCustomer) {
        customerId = authCustomer.id;
      }
    }

    // 7. Generate unique order number (retry if collision — extremely unlikely)
    let orderNumber = generateOrderNumber();
    let orderExists = await db.order.findUnique({
      where: { orderNumber },
    });
    let retries = 0;
    while (orderExists && retries < 5) {
      orderNumber = generateOrderNumber();
      orderExists = await db.order.findUnique({ where: { orderNumber } });
      retries++;
    }

    // 8. Create order with transaction — Plan: §Phase 4 Row-Level Locks
    //    1. Lock variants FOR UPDATE (prevents concurrent stock race conditions)
    //    2. Re-validate stock under lock
    //    3. Deduct inventory (is_out_of_stock trigger fires automatically)
    //    4. Create order + order items
    const order = await db.$transaction(async (tx) => {
      // ── Step 1: Lock variants for update (row-level lock) ──
      // Plan: SELECT * FROM product_variants WHERE id IN (variant_ids) FOR UPDATE;
      const lockedVariants = await tx.$queryRaw<
        Array<{
          id: number;
          sku: string;
          "productId": number;
          "variantType": string;
          "variantValue": string;
          price: number | null;
          "stockQuantity": number;
          "isOutOfStock": boolean;
        }>
      >(Prisma.sql`SELECT * FROM "ProductVariant" WHERE id IN (${Prisma.join(variantIds)}) FOR UPDATE`);

      const lockedMap = new Map(lockedVariants.map((v) => [v.id, v]));

      // ── Step 2: Re-validate stock under lock ──
      for (const item of cart) {
        const variant = lockedMap.get(item.variant_id);
        if (!variant) {
          throw new Error(`Variant ID ${item.variant_id} not found`);
        }
        if (variant.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for variant ${item.variant_id}. Only ${variant.stockQuantity} available. `
            + `(Concurrent order may have claimed remaining stock.)`
          );
        }
      }

      // ── Step 3: Deduct inventory (trigger sets isOutOfStock automatically) ──
      for (const item of cart) {
        const newStock = lockedMap.get(item.variant_id)!.stockQuantity - item.quantity;
        await tx.productVariant.update({
          where: { id: item.variant_id },
          data: { stockQuantity: newStock },
          // isOutOfStock is set by the DB trigger (set_is_out_of_stock)
        });
      }

      // ── Step 4: Create order ──
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: "pending",
          cartTotal,
          shippingAddress: address,
          consentGiven: consent ?? false,
        },
      });

      // ── Step 5: Create order items ──
      for (const item of cart) {
        const variant = lockedMap.get(item.variant_id)!;
        const preVariant = preCheckMap.get(item.variant_id)!;
        const unitPrice = variant.price ?? preVariant.product?.price ?? 0;

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            variantId: item.variant_id,
            quantity: item.quantity,
            unitPrice,
            variantSnapshot: {
              sku: variant.sku,
              variantType: variant.variantType,
              variantValue: variant.variantValue,
              productName: preVariant.product?.name ?? "",
            },
          },
        });
      }

      return newOrder;
    });

    // NOTE: No email notification sent (Resolution #1). Admin monitors dashboard manually.

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}