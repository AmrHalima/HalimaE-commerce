-- AlterTable
ALTER TABLE "customer_refresh_tokens" ADD COLUMN     "device" TEXT,
ADD COLUMN     "ip" TEXT;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "device" TEXT,
ADD COLUMN     "ip" TEXT;
