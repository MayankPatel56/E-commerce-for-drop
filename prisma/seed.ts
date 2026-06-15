import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create admin user (password: admin account — 16+ chars as per plan)
  const adminPassword = await bcrypt.hash("IndicoreAdmin2024!Secure", 10);

  const adminUser = await db.user.upsert({
    where: { email: "admin@indicoreoriginals.com" },
    update: { password: adminPassword },
    create: {
      email: "admin@indicoreoriginals.com",
      name: "Indicore Admin",
      password: adminPassword,
      customer: {
        create: {
          email: "admin@indicoreoriginals.com",
          name: "Indicore Admin",
          phone: "9999999999",
          role: "admin",
          isRegistered: true,
          emailConsentGiven: false,
        },
      },
    },
    include: { customer: true },
  });

  console.log(`✅ Admin user created: ${adminUser.email} (role: ${adminUser.customer?.role})`);

  // 2. Seed default settings (no email config — V1 sends no emails)
  const defaultSettings = [
    { key: "cod_min_order_value", value: JSON.stringify({ value: 299 }) },
    { key: "cod_max_order_value", value: JSON.stringify({ value: 50000 }) },
    { key: "store_name", value: JSON.stringify({ value: "Indicore Originals" }) },
    { key: "store_email", value: JSON.stringify({ value: "support@indicoreoriginals.com" }) },
    { key: "store_phone", value: JSON.stringify({ value: "+91XXXXXXXXXX" }) },
    {
      key: "social_links",
      value: JSON.stringify({
        instagram: "https://instagram.com/indicore",
        facebook: "https://facebook.com/indicore",
      }),
    },
  ];

  for (const setting of defaultSettings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("✅ Settings seeded (6 keys)");

  // 3. Seed homepage content singleton (includes customer_reviews — Resolution #6)
  await db.homepageContent.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      heroBanner: JSON.stringify({
        image_url: "/placeholder-hero.jpg",
        text: "Welcome to Indicore Originals",
        cta_text: "Shop Now",
        cta_link: "/shop",
      }),
      featuredProductIds: JSON.stringify([]),
      categoriesSection: JSON.stringify({ display_categories: [] }),
      whyChooseUs: JSON.stringify([
        { icon: "truck", title: "Free Shipping", description: "On orders above ₹299" },
        { icon: "shield-check", title: "Secure Payments", description: "COD available" },
        { icon: "refresh-cw", title: "Easy Returns", description: "Hassle-free return policy" },
        { icon: "headphones", title: "24/7 Support", description: "We're here to help" },
      ]),
      customerReviews: JSON.stringify({ max_reviews_to_show: 6 }),
      footer: JSON.stringify({
        contact_text: "support@indicoreoriginals.com",
        social_links: {
          instagram: "https://instagram.com/indicore",
          facebook: "https://facebook.com/indicore",
        },
        copyright_text: "© 2024 Indicore Originals. All rights reserved.",
      }),
    },
  });

  console.log("✅ Homepage content singleton seeded (id: 1)");

  // ─── Phase 3: Seed sample storefront data ──────────────────────────────

  // 4. Seed categories
  const categories = await Promise.all([
    db.category.upsert({ where: { name: "T-Shirts" }, update: {}, create: { name: "T-Shirts", slug: "tshirts" } }),
    db.category.upsert({ where: { name: "Hoodies" }, update: {}, create: { name: "Hoodies", slug: "hoodies" } }),
    db.category.upsert({ where: { name: "Accessories" }, update: {}, create: { name: "Accessories", slug: "accessories" } }),
    db.category.upsert({ where: { name: "Jackets" }, update: {}, create: { name: "Jackets", slug: "jackets" } }),
  ]);
  console.log(`✅ Categories seeded (${categories.length})`);

  // 5. Seed tags
  const tags = await Promise.all([
    db.tag.upsert({ where: { name: "cotton" }, update: {}, create: { name: "cotton" } }),
    db.tag.upsert({ where: { name: "premium" }, update: {}, create: { name: "premium" } }),
    db.tag.upsert({ where: { name: "bestseller" }, update: {}, create: { name: "bestseller" } }),
    db.tag.upsert({ where: { name: "new-arrival" }, update: {}, create: { name: "new-arrival" } }),
    db.tag.upsert({ where: { name: "summer" }, update: {}, create: { name: "summer" } }),
    db.tag.upsert({ where: { name: "winter" }, update: {}, create: { name: "winter" } }),
    db.tag.upsert({ where: { name: "unisex" }, update: {}, create: { name: "unisex" } }),
  ]);
  console.log(`✅ Tags seeded (${tags.length})`);

  // 6. Seed FAQs
  const faqs = [
    { question: "What payment methods do you accept?", answer: "We currently accept Cash on Delivery (COD) for all orders. Pay when your order arrives at your doorstep.", displayOrder: 1 },
    { question: "How long does delivery take?", answer: "Standard delivery takes 5-7 business days across India. You will receive updates via phone from our team.", displayOrder: 2 },
    { question: "Can I return or exchange a product?", answer: "Yes! We offer hassle-free returns within 7 days of delivery. Contact us via phone or WhatsApp to initiate a return.", displayOrder: 3 },
    { question: "How do I track my order?", answer: "You can track your order using the Order ID and email address on our Track Order page. Our team also provides updates via phone.", displayOrder: 4 },
    { question: "Do you ship across India?", answer: "Yes, we ship to all pin codes across India. Free shipping on orders above ₹299.", displayOrder: 5 },
    { question: "How can I contact customer support?", answer: "You can reach us via email at support@indicoreoriginals.com or message us on Instagram @indicore for quick support.", displayOrder: 6 },
  ];

  for (const faq of faqs) {
    await db.faq.upsert({
      where: { id: faq.displayOrder },
      update: { question: faq.question, answer: faq.answer },
      create: faq,
    });
  }
  console.log(`✅ FAQs seeded (${faqs.length})`);

  // 7. Seed sample products with variants and tags
  const productsData = [
    {
      name: "Classic Black T-Shirt",
      slug: "classic-black-tshirt",
      description: "A timeless black t-shirt crafted from premium 100% cotton. Features a relaxed fit with a soft hand feel, perfect for everyday wear. Durable stitching and color that lasts.",
      price: 599,
      primaryImage: "",
      categoryId: categories[0].id,
      published: true,
      tags: [tags[0].id, tags[2].id, tags[6].id], // cotton, bestseller, unisex
      variants: [
        { sku: "CBT-S", type: "size", value: "S", stock: 15 },
        { sku: "CBT-M", type: "size", value: "M", stock: 20 },
        { sku: "CBT-L", type: "size", value: "L", stock: 18 },
        { sku: "CBT-XL", type: "size", value: "XL", stock: 10 },
      ],
    },
    {
      name: "White Essential Tee",
      slug: "white-essential-tee",
      description: "Your wardrobe essential — a crisp white t-shirt in premium combed cotton. Features a slim fit design with reinforced shoulders and a clean neckline.",
      price: 499,
      primaryImage: "",
      categoryId: categories[0].id,
      published: true,
      tags: [tags[0].id, tags[3].id, tags[4].id, tags[6].id], // cotton, new-arrival, summer, unisex
      variants: [
        { sku: "WET-S", type: "size", value: "S", stock: 12 },
        { sku: "WET-M", type: "size", value: "M", stock: 25 },
        { sku: "WET-L", type: "size", value: "L", stock: 20 },
        { sku: "WET-XL", type: "size", value: "XL", stock: 8 },
      ],
    },
    {
      name: "Midnight Blue Hoodie",
      slug: "midnight-blue-hoodie",
      description: "Stay cozy in our premium midnight blue hoodie. Made from a cotton-polyester blend with a brushed fleece interior. Features kangaroo pocket and adjustable drawstring hood.",
      price: 1299,
      primaryImage: "",
      categoryId: categories[1].id,
      published: true,
      tags: [tags[1].id, tags[2].id, tags[5].id, tags[6].id], // premium, bestseller, winter, unisex
      variants: [
        { sku: "MBH-S", type: "size", value: "S", stock: 8 },
        { sku: "MBH-M", type: "size", value: "M", stock: 15 },
        { sku: "MBH-L", type: "size", value: "L", stock: 12 },
        { sku: "MBH-XL", type: "size", value: "XL", stock: 5 },
      ],
    },
    {
      name: "Olive Green Oversized Tee",
      slug: "olive-green-oversized-tee",
      description: "Make a statement with our oversized olive green tee. Drop-shoulder design with a boxy fit. Perfect for a relaxed, street-style look.",
      price: 749,
      primaryImage: "",
      categoryId: categories[0].id,
      published: true,
      tags: [tags[0].id, tags[3].id, tags[4].id], // cotton, new-arrival, summer
      variants: [
        { sku: "OGOT-M", type: "size", value: "M", stock: 10 },
        { sku: "OGOT-L", type: "size", value: "L", stock: 14 },
        { sku: "OGOT-XL", type: "size", value: "XL", stock: 7 },
      ],
    },
    {
      name: "Charcoal Bomber Jacket",
      slug: "charcoal-bomber-jacket",
      description: "Elevate your outerwear with our charcoal bomber jacket. Water-resistant shell with quilted lining. Ribbed cuffs and hem for a classic bomber silhouette.",
      price: 2499,
      primaryImage: "",
      categoryId: categories[3].id,
      published: true,
      tags: [tags[1].id, tags[5].id, tags[6].id], // premium, winter, unisex
      variants: [
        { sku: "CBJ-M", type: "size", value: "M", stock: 6 },
        { sku: "CBJ-L", type: "size", value: "L", stock: 8 },
        { sku: "CBJ-XL", type: "size", value: "XL", stock: 4 },
      ],
    },
    {
      name: "Navy Blue Polo",
      slug: "navy-blue-polo",
      description: "A classic navy blue polo shirt. Made from premium pique cotton with a two-button placket. Perfect for smart-casual occasions.",
      price: 899,
      primaryImage: "",
      categoryId: categories[0].id,
      published: true,
      tags: [tags[0].id, tags[1].id], // cotton, premium
      variants: [
        { sku: "NBP-S", type: "size", value: "S", stock: 10 },
        { sku: "NBP-M", type: "size", value: "M", stock: 18 },
        { sku: "NBP-L", type: "size", value: "L", stock: 15 },
        { sku: "NBP-XL", type: "size", value: "XL", stock: 8 },
      ],
    },
    {
      name: "Maroon Crew Neck Sweatshirt",
      slug: "maroon-crew-neck-sweatshirt",
      description: "Stay warm in style with our maroon crew neck sweatshirt. Heavyweight cotton blend with a soft fleece lining. Ribbed cuffs and hem for a comfortable fit.",
      price: 1099,
      primaryImage: "",
      categoryId: categories[1].id,
      published: true,
      tags: [tags[1].id, tags[5].id, tags[6].id], // premium, winter, unisex
      variants: [
        { sku: "MCNS-S", type: "size", value: "S", stock: 5 },
        { sku: "MCNS-M", type: "size", value: "M", stock: 12 },
        { sku: "MCNS-L", type: "size", value: "L", stock: 9 },
        { sku: "MCNS-XL", type: "size", value: "XL", stock: 3 },
      ],
    },
    {
      name: "Minimalist Canvas Belt",
      slug: "minimalist-canvas-belt",
      description: "Complete your look with our minimalist canvas belt. Durable canvas strap with a matte black metal buckle. Adjustable length for a perfect fit.",
      price: 349,
      primaryImage: "",
      categoryId: categories[2].id,
      published: true,
      tags: [tags[3].id, tags[6].id], // new-arrival, unisex
      variants: [
        { sku: "MCB-BLK", type: "color", value: "Black", stock: 20 },
        { sku: "MCB-BRN", type: "color", value: "Brown", stock: 15 },
        { sku: "MCB-OLV", type: "color", value: "Olive", stock: 10 },
      ],
    },
  ];

  const createdProducts = [];
  for (const pData of productsData) {
    const product = await db.product.upsert({
      where: { slug: pData.slug },
      update: {},
      create: {
        name: pData.name,
        slug: pData.slug,
        description: pData.description,
        price: pData.price,
        primaryImage: pData.primaryImage,
        isPublished: pData.published,
        categoryId: pData.categoryId,
        variants: {
          create: pData.variants.map((v) => ({
            sku: v.sku,
            variantType: v.type,
            variantValue: v.value,
            stockQuantity: v.stock,
            isOutOfStock: v.stock <= 0,
          })),
        },
        productTags: {
          create: pData.tags.map((tagId) => ({ tagId })),
        },
      },
      include: { variants: true, productTags: true },
    });
    createdProducts.push(product);
  }
  console.log(`✅ Products seeded (${createdProducts.length})`);

  // 8. Update featured product IDs on homepage (first 4 products)
  const featuredIds = createdProducts.slice(0, 4).map((p) => p.id);
  await db.homepageContent.update({
    where: { id: 1 },
    data: { featuredProductIds: JSON.stringify(featuredIds) },
  });
  console.log(`✅ Featured products set (IDs: ${featuredIds.join(", ")})`);

  // 9. Seed sample approved reviews (from "delivered" customers)
  // First create a sample customer
  const reviewCustomer = await db.user.create({
    data: {
      email: "reviewer@example.com",
      name: "Priya Sharma",
      password: await bcrypt.hash("ReviewerPass123", 10),
      customer: {
        create: {
          email: "reviewer@example.com",
          name: "Priya Sharma",
          phone: "9876543210",
          role: "customer",
          isRegistered: true,
          emailConsentGiven: true,
        },
      },
    },
    include: { customer: true },
  });

  const customerId = reviewCustomer.customer!.id;

  // Create a delivered order for review validation
  const sampleOrder = await db.order.create({
    data: {
      orderNumber: "ORD-1700000000-ABC123",
      customerId: customerId,
      status: "delivered",
      cartTotal: 599,
      shippingAddress: JSON.stringify({ street: "123 MG Road", city: "Mumbai", state: "Maharashtra", pincode: "400001" }),
      consentGiven: false,
    },
  });

  // Create order item
  const firstProduct = createdProducts[0];
  const firstVariant = firstProduct.variants[0];
  await db.orderItem.create({
    data: {
      orderId: sampleOrder.id,
      variantId: firstVariant.id,
      quantity: 1,
      unitPrice: firstProduct.price,
      variantSnapshot: JSON.stringify({ type: firstVariant.variantType, value: firstVariant.variantValue }),
    },
  });

  // Create sample reviews (one per product per customer due to unique constraint)
  const sampleReviews = [
    { productId: firstProduct.id, rating: 5, title: "Amazing quality!", comment: "The fabric is super soft and the fit is perfect. Will definitely buy more colors.", daysAgo: 2 },
    { productId: createdProducts[1].id, rating: 5, title: "Perfect white tee", comment: "Finally found a white tee that doesn't become see-through after washing. The cotton quality is excellent.", daysAgo: 1 },
    { productId: createdProducts[2].id, rating: 4, title: "Super cozy", comment: "The fleece lining makes it incredibly warm. Only wish it came in more colors.", daysAgo: 7 },
    { productId: createdProducts[3].id, rating: 4, title: "Great oversized fit", comment: "Love the drop-shoulder design. The olive green color is beautiful in person.", daysAgo: 3 },
  ];

  for (const r of sampleReviews) {
    await db.review.create({
      data: {
        productId: r.productId,
        customerId: customerId,
        orderId: sampleOrder.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: "approved",
        reviewedAt: new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ Sample reviews seeded (${sampleReviews.length})`);

  console.log("🎉 Seed complete!");
  console.log("");
  console.log("Admin credentials:");
  console.log("  Email:    admin@indicoreoriginals.com");
  console.log("  Password: IndicoreAdmin2024!Secure");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });