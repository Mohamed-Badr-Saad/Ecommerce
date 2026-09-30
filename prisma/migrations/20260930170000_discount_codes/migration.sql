-- Admin-managed discount (coupon) codes applied to carts and recorded on orders.
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "minSubtotal" DECIMAL(12,2),
    "maxDiscount" DECIMAL(12,2),
    "usageLimit" INTEGER,
    "perCustomerLimit" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");
CREATE INDEX "discount_codes_isActive_idx" ON "discount_codes"("isActive");

ALTER TABLE "carts" ADD COLUMN "discountCodeId" TEXT;
ALTER TABLE "carts" ADD CONSTRAINT "carts_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders" ADD COLUMN "couponDiscount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "discountCode" TEXT,
ADD COLUMN "discountCodeId" TEXT;
CREATE INDEX "orders_discountCodeId_status_idx" ON "orders"("discountCodeId", "status");
ALTER TABLE "orders" ADD CONSTRAINT "orders_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Match the Supabase hardening applied to every other application table.
ALTER TABLE public."discount_codes" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public."discount_codes" FROM anon, authenticated;
  END IF;
END $$;
