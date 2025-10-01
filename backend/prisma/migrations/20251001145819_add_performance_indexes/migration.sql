-- CreateIndex
CREATE INDEX "Category_name_idx" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "public"."Product"("name");

-- CreateIndex
CREATE INDEX "customers_status_createdAt_idx" ON "public"."customers"("status", "createdAt");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "public"."orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "orders_fulfillmentStatus_idx" ON "public"."orders"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "orders_customerId_placedAt_idx" ON "public"."orders"("customerId", "placedAt");
