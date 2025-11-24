/*
  Warnings:

  - You are about to drop the column `device` on the `customer_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `customer_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `isRevoked` on the `customer_refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `device` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `isRevoked` on the `refresh_tokens` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "customer_refresh_tokens" DROP CONSTRAINT "customer_refresh_tokens_customerId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropIndex
DROP INDEX "customer_refresh_tokens_tokenHash_idx";

-- DropIndex
DROP INDEX "refresh_tokens_tokenHash_idx";

-- AlterTable
ALTER TABLE "customer_refresh_tokens" DROP COLUMN "device",
DROP COLUMN "ip",
DROP COLUMN "isRevoked";

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "device",
DROP COLUMN "ip",
DROP COLUMN "isRevoked";

-- CreateIndex
CREATE INDEX "customer_refresh_tokens_expiresAt_idx" ON "customer_refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_refresh_tokens" ADD CONSTRAINT "customer_refresh_tokens_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
