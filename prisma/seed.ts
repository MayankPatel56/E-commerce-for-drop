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