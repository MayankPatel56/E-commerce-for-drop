-- ============================================================================
-- COMPREHENSIVE SUPABASE COMPLIANCE MIGRATION (v2 — with auth.uid()::text cast)
-- Implements: Functions, Triggers, RLS Policies
-- Source of truth: Implementation Plan (plan_text.txt)
-- ============================================================================
-- NOTE: Table names are PascalCase, column names are camelCase (Prisma default)
-- NOTE: auth.uid() returns UUID; our PKs are TEXT (cuid) — cast with ::text
-- NOTE: RLS is bypassed by service role (Prisma uses postgres superuser).
--       Policies serve as defense-in-depth for anon-key access patterns.
-- ============================================================================

-- ============================================================================
-- PART 1: POSTGRESQL FUNCTIONS
-- ============================================================================

-- 1a. generate_order_number() — Plan: §Phase 4, §12 Triggers & Functions #3
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  timestamp_part := EXTRACT(EPOCH FROM NOW())::TEXT;
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  RETURN 'ORD-' || timestamp_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- 1b. generate_unique_slug(base_slug TEXT) — Plan: §Phase 2, Slug Uniqueness
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  new_slug TEXT;
  counter INT := 0;
BEGIN
  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM "Product" WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- 1c. cleanup_order_track_attempts() — Plan: §Phase 5, Database Work
CREATE OR REPLACE FUNCTION cleanup_order_track_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM "OrderTrackAttempt" WHERE "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql;

-- 1d. Generic updated_at trigger function — Plan: §12 Triggers & Functions #2
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1e. is_out_of_stock trigger function — Plan: §12 Triggers & Functions #1
-- CRITICAL: Modifies NEW only — does NOT update same table (avoids mutation)
CREATE OR REPLACE FUNCTION set_is_out_of_stock()
RETURNS TRIGGER AS $$
BEGIN
  NEW."isOutOfStock" := (NEW."stockQuantity" <= 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 2: TRIGGERS
-- ============================================================================

-- 2a. is_out_of_stock trigger on ProductVariant
-- Plan: §5 Key Implementation Details, §12 #1
CREATE TRIGGER trigger_update_is_out_of_stock
  BEFORE INSERT OR UPDATE ON "ProductVariant"
  FOR EACH ROW
  EXECUTE FUNCTION set_is_out_of_stock();

-- 2b. updated_at triggers on all tables with updatedAt column
-- Tables with updatedAt: Category, Customer, Faq, HomepageContent, Order, Product, Review, Tag, User

CREATE TRIGGER trigger_update_updated_at_category
  BEFORE UPDATE ON "Category"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_customer
  BEFORE UPDATE ON "Customer"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_faq
  BEFORE UPDATE ON "Faq"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_homepagecontent
  BEFORE UPDATE ON "HomepageContent"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_order
  BEFORE UPDATE ON "Order"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_product
  BEFORE UPDATE ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_review
  BEFORE UPDATE ON "Review"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_tag
  BEFORE UPDATE ON "Tag"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_updated_at_user
  BEFORE UPDATE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- Plan: §8 Row Level Security — "Least privilege - every table has RLS enabled"
-- ============================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wishlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HomepageContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderTrackAttempt" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: RLS POLICIES
-- ============================================================================
-- NOTE: Service role bypasses RLS. Policies enforce least-privilege for
--       anon-key access (defense-in-depth per §8).
-- NOTE: auth.uid() returns UUID, our PKs are TEXT — use auth.uid()::text
-- ============================================================================

-- ─── 4a. User table ──────────────────────────────────────────────────────
CREATE POLICY "Users read own row" ON "User"
  FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users update own row" ON "User"
  FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Admins all users" ON "User"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );
CREATE POLICY "Allow user creation" ON "User"
  FOR INSERT WITH CHECK (true);

-- ─── 4b. Customer table ─────────────────────────────────────────────────
-- Plan: §Phase 1 RLS Policies (Mandatory)
CREATE POLICY "Users read own customer row" ON "Customer"
  FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users update own customer row" ON "Customer"
  FOR UPDATE USING (auth.uid()::text = id);
-- Plan: §8 Critical - Guest INSERT policy
CREATE POLICY "Allow guest customer creation" ON "Customer"
  FOR INSERT WITH CHECK (true);
-- Admin full access
CREATE POLICY "Admins all customers" ON "Customer"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4c. Category table ─────────────────────────────────────────────────
-- Plan: Public read, admin write
CREATE POLICY "Public read categories" ON "Category"
  FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON "Category"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4d. Tag table ──────────────────────────────────────────────────────
-- Plan: Public read, admin write
CREATE POLICY "Public read tags" ON "Tag"
  FOR SELECT USING (true);
CREATE POLICY "Admins manage tags" ON "Tag"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4e. Product table ──────────────────────────────────────────────────
-- Plan: Public read (published only), admin write
CREATE POLICY "Public read published products" ON "Product"
  FOR SELECT USING ("isPublished" = true);
CREATE POLICY "Admins manage products" ON "Product"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4f. ProductVariant table ───────────────────────────────────────────
-- Plan: Public read, admin write
CREATE POLICY "Public read variants" ON "ProductVariant"
  FOR SELECT USING (true);
CREATE POLICY "Admins manage variants" ON "ProductVariant"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4g. ProductTag table ───────────────────────────────────────────────
-- Plan: Public read, admin write
CREATE POLICY "Public read product tags" ON "ProductTag"
  FOR SELECT USING (true);
CREATE POLICY "Admins manage product tags" ON "ProductTag"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4h. Order table ────────────────────────────────────────────────────
-- Plan: Customers read own, guest INSERT, admin all
CREATE POLICY "Users read own orders" ON "Order"
  FOR SELECT USING ("customerId" = auth.uid()::text);
-- Plan: §8 Critical - Guest INSERT policy for checkout
CREATE POLICY "Allow guest order creation" ON "Order"
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own orders" ON "Order"
  FOR UPDATE USING ("customerId" = auth.uid()::text);
-- Admin full access
CREATE POLICY "Admins all orders" ON "Order"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4i. OrderItem table ────────────────────────────────────────────────
-- Plan: Allow INSERT with orders, users read own, admin all
CREATE POLICY "Public insert order items" ON "OrderItem"
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users read own order items" ON "OrderItem"
  FOR SELECT USING (
    "orderId" IN (SELECT id FROM "Order" WHERE "customerId" = auth.uid()::text)
  );
CREATE POLICY "Admins all order items" ON "OrderItem"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4j. Review table ───────────────────────────────────────────────────
-- Plan: Public read approved, customers create/update own, admin all
CREATE POLICY "Public read approved reviews" ON "Review"
  FOR SELECT USING ("status" = 'approved');
CREATE POLICY "Customers create own reviews" ON "Review"
  FOR INSERT WITH CHECK ("customerId" = auth.uid()::text);
CREATE POLICY "Customers update own reviews" ON "Review"
  FOR UPDATE USING ("customerId" = auth.uid()::text);
CREATE POLICY "Admins all reviews" ON "Review"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4k. Wishlist table ─────────────────────────────────────────────────
-- Plan: Users manage own wishlist
CREATE POLICY "Users read own wishlist" ON "Wishlist"
  FOR SELECT USING ("customerId" = auth.uid()::text);
CREATE POLICY "Users manage own wishlist" ON "Wishlist"
  FOR INSERT WITH CHECK ("customerId" = auth.uid()::text);
CREATE POLICY "Users delete own wishlist" ON "Wishlist"
  FOR DELETE USING ("customerId" = auth.uid()::text);
CREATE POLICY "Admins all wishlist" ON "Wishlist"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4l. Faq table ──────────────────────────────────────────────────────
-- Plan: Public read, admin write
CREATE POLICY "Public read faqs" ON "Faq"
  FOR SELECT USING (true);
CREATE POLICY "Admins manage faqs" ON "Faq"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4m. HomepageContent table ──────────────────────────────────────────
-- Plan: Public read, admin write
CREATE POLICY "Public read homepage" ON "HomepageContent"
  FOR SELECT USING (true);
CREATE POLICY "Admins manage homepage" ON "HomepageContent"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4n. Setting table ──────────────────────────────────────────────────
-- Plan: Public read, admin write
CREATE POLICY "Public read settings" ON "Setting"
  FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON "Setting"
  FOR ALL USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );

-- ─── 4o. OrderTrackAttempt table ────────────────────────────────────────
-- Plan: §8 Critical - Allow INSERT for rate limiting, admin read
CREATE POLICY "Public insert tracking attempts" ON "OrderTrackAttempt"
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read tracking attempts" ON "OrderTrackAttempt"
  FOR SELECT USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );
CREATE POLICY "Admins delete tracking attempts" ON "OrderTrackAttempt"
  FOR DELETE USING (
    (SELECT "role" FROM "Customer" WHERE id = auth.uid()::text) = 'admin'
  );