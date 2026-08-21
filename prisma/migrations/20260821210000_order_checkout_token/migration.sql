ALTER TABLE "orders" ADD COLUMN "checkoutToken" TEXT;

UPDATE "orders"
SET "checkoutToken" = md5("id" || clock_timestamp()::text)
WHERE "checkoutToken" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "checkoutToken" SET NOT NULL;

CREATE UNIQUE INDEX "orders_checkoutToken_key" ON "orders"("checkoutToken");
