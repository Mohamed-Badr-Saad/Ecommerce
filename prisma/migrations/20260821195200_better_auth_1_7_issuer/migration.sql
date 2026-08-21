DROP INDEX "accounts_providerId_accountId_key";

ALTER TABLE "accounts" ADD COLUMN "issuer" TEXT NOT NULL;

CREATE UNIQUE INDEX "accounts_issuer_accountId_key" ON "accounts"("issuer", "accountId");
