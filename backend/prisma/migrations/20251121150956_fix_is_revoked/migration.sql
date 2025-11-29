-- AlterTable
ALTER TABLE "customer_refresh_tokens" ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false;
