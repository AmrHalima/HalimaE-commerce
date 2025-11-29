/*
  Warnings:

  - You are about to drop the column `customertId` on the `password_reset_tokens` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_customertId_fkey";

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "customertId",
ADD COLUMN     "customerId" UUID;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
