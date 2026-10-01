-- Customer feedback screenshots curated by admins and shown on the homepage.
CREATE TABLE "customer_feedback" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "altText" TEXT,
    "customerName" TEXT,
    "caption" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_feedback_isActive_displayOrder_idx" ON "customer_feedback"("isActive", "displayOrder");

-- Match the Supabase hardening applied to every other application table.
ALTER TABLE public."customer_feedback" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public."customer_feedback" FROM anon, authenticated;
  END IF;
END $$;
