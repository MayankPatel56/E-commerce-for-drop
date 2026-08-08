import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";
import { requireAdmin } from "@/lib/admin-auth";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

const updateReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

/**
 * GET /api/reviews
 * Get reviews for a product (public) or all reviews (admin)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status");
  const admin = searchParams.get("admin") === "true";

  try {
    // If admin=true, check admin authentication
    if (admin) {
      const { error } = await requireAdmin();
      if (error) return error;

      // Admin view: get all reviews with filters
      const where: any = {};
      if (status) where.status = status;
      if (productId) where.productId = parseInt(productId, 10);

      const [reviews, total] = await Promise.all([
        db.review.findMany({
          where,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true, // Include avatar field
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.review.count({ where }),
      ]);

      return NextResponse.json({
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Public view: get approved reviews for a product
    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const where = {
      productId: parseInt(productId, 10),
      status: "approved",
    };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              avatar: true, // Include avatar field - can be null for fallback
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    // Transform reviews to ensure avatar handling
    const transformedReviews = reviews.map((review) => ({
      ...review,
      customer: {
        ...review.customer,
        // If avatar is null or empty string, the UI will use initials fallback
        avatar: review.customer?.avatar || null,
      },
    }));

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Submit a review (registered customers only, purchase-validated)
 */
export async function POST(request: NextRequest) {
  const { error, customer } = await requireCustomer();
  if (error) return error;

  try {
    const body = await request.json();
    const result = reviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { productId, rating, title, comment } = result.data;

    // Rate limit: 5 reviews per hour per customer
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReviews = await db.review.count({
      where: {
        customerId: customer.userId,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentReviews >= 5) {
      return NextResponse.json(
        { error: "You can submit at most 5 reviews per hour. Please try again later." },
        { status: 429 }
      );
    }

    // 1. Verify delivered order containing this product
    const deliveredOrder = await db.order.findFirst({
      where: {
        customerId: customer.userId,
        status: "delivered",
        orderItems: {
          some: {
            variant: {
              productId,
            },
          },
        },
      },
      select: { id: true },
    });

    if (!deliveredOrder) {
      return NextResponse.json(
        { error: "You can only review products you have purchased and received" },
        { status: 403 }
      );
    }

    // 2. Check if already reviewed (DB has unique constraint, but check for clean error)
    const existingReview = await db.review.findUnique({
      where: {
        productId_customerId: {
          productId,
          customerId: customer.userId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    // 3. Create review with status='pending'
    const review = await db.review.create({
      data: {
        productId,
        customerId: customer.userId,
        orderId: deliveredOrder.id,
        rating,
        title,
        comment,
        status: "pending",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true, // Include avatar to return to client
          },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reviews/:id
 * Update a review (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const reviewId = parseInt(params.id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { status, rating, title, comment } = result.data;

    // Check if review exists
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update review
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        status,
        ...(rating !== undefined && { rating }),
        ...(title !== undefined && { title }),
        ...(comment !== undefined && { comment }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/:id
 * Delete a review (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const reviewId = parseInt(params.id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    // Check if review exists
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Delete review
    await db.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}