-- Messages sent through the homepage "Share your feedback" form.
CREATE TABLE "feedback_messages" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "feedback_messages_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE INDEX "feedback_messages_isRead_createdAt_idx" ON "feedback_messages"("isRead", "createdAt");
CREATE INDEX "feedback_messages_ipHash_createdAt_idx" ON "feedback_messages"("ipHash", "createdAt");

ALTER TABLE "feedback_messages" ADD CONSTRAINT "feedback_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Match the Supabase hardening applied to every other application table.
ALTER TABLE public."feedback_messages" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public."feedback_messages" FROM anon, authenticated;
  END IF;
END $$;
