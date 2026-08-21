ALTER TABLE "orders"
ADD COLUMN "inventoryReservedAt" TIMESTAMP(3),
ADD COLUMN "reservationExpiresAt" TIMESTAMP(3),
ADD COLUMN "inventoryReleasedAt" TIMESTAMP(3);

CREATE INDEX "orders_paymentMethod_paymentStatus_reservationExpiresAt_idx"
ON "orders"("paymentMethod", "paymentStatus", "reservationExpiresAt");
