import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import type { IPaymentProvider } from './interfaces';
import { PAYMENTMETHOD, PAYMENTSTATUS, Prisma } from '@prisma/client';
import { CreatePaymentIntentDto, SavePaymentDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../logger/log.service';

@Injectable()
export class PaymentService {
    constructor(
        @Inject('IPaymentProvider')
        private readonly paymentProvider: IPaymentProvider,
        private readonly prisma: PrismaService,
        private readonly logger: LogService
    ) {}

    /**
     * Create payment intent and return payment URL
     * Returns null for cash on delivery
     */
    async createPaymentIntent(dto: CreatePaymentIntentDto): Promise<string | null> {
        try {
            if (dto.method === PAYMENTMETHOD.CASH_ON_DELIVERY) {
                this.logger.log(
                    `Cash on delivery payment for order ${dto.orderId}`,
                    PaymentService.name
                );
                return null;
            }

            if (dto.amount <= 0) {
                throw new BadRequestException('Payment amount must be greater than zero');
            }

            // Create payment intent with provider
            const paymentUrl = await this.paymentProvider.createPaymentIntent(
                dto.amount,
                dto.currency,
                dto.method,
                dto.billing_address,
            );

            this.logger.log(
                `Payment intent created for order ${dto.orderId} with method ${dto.method}`,
                PaymentService.name
            );

            return paymentUrl;
        } catch (error) {
            this.logger.error(
                `Failed to create payment intent for order ${dto.orderId}`,
                error.stack,
                PaymentService.name
            );
            throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
        }
    }

    /**
     * Handle webhook from payment provider and save payment to database
     */
    async handleWebhook(payload: any, signature: string, headers: any): Promise<void> {
        try {
            // Parse webhook data from provider
            const webhookData = await this.paymentProvider.handleWebhook(payload, signature, headers);

            this.logger.log(
                `Webhook received for order ${webhookData.orderId}, status: ${webhookData.status}`,
                PaymentService.name
            );

            // Save payment to database
            await this.savePayment({
                orderId    : webhookData.orderId,
                provider   : this.paymentProvider.providerName,
                providerRef: webhookData.transactionId,
                amount     : new Prisma.Decimal(webhookData.amount),
                currency   : webhookData.currency,
                status     : webhookData.status as PAYMENTSTATUS,
                method     : webhookData.method as PAYMENTMETHOD,
                capturedAt : webhookData.capturedAt,
            });

            this.logger.log(
                `Payment saved for order ${webhookData.orderId}`,
                PaymentService.name
            );
        } catch (error) {
            this.logger.error(
                `Failed to handle webhook`,
                error.stack,
                PaymentService.name
            );
            throw error;
        }
    }

    /**
     * Save payment to database with idempotency check
     */
    async savePayment(dto: SavePaymentDto): Promise<void> {
        try {
            // Check if payment already exists (idempotency) - Only select id for optimization
            const existingPayment = await this.prisma.payment.findFirst({
                where: {
                    providerRef: dto.providerRef,
                    provider: dto.provider,
                },
                select: { id: true }
            });

            if (existingPayment) {
                this.logger.log(
                    `Payment with providerRef ${dto.providerRef} already exists, skipping`,
                    PaymentService.name
                );
                return;
            }

            // Create payment record
            await this.prisma.$transaction(async (tx) => {
                // Create payment
                await tx.payment.create({
                    data: {
                        orderId: dto.orderId,
                        provider: dto.provider,
                        providerRef: dto.providerRef,
                        amount: dto.amount,
                        currency: dto.currency,
                        status: dto.status,
                        method: dto.method,
                        capturedAt: dto.capturedAt,
                    },
                });
                
                // Update order status
                if (dto.status === PAYMENTSTATUS.PAID) {
                    await tx.order.update({
                        where: { id: dto.orderId },
                        data: { paymentStatus: 'PAID' },
                    });
                }
            });

            this.logger.log(
                `Payment with providerRef ${dto.providerRef} saved successfully`,
                PaymentService.name
            );
        } catch (error) {
            this.logger.error(
                `Failed to save payment for order ${dto.orderId}`,
                error.stack,
                PaymentService.name
            );
            throw error;
        }
    }

    /**
     * Record cash payment (for admin/courier use)
     * Optimized: Only selects id field for validation
     */
    async recordCashPayment(orderId: string, amount: number, currency: string): Promise<void> {
        try {
            // Check if order exists
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                select: { id: true }
            });

            if (!order) {
                throw new NotFoundException(`Order ${orderId} not found`);
            }

            // Check if cash payment already recorded
            const existingPayment = await this.prisma.payment.findFirst({
                where: {
                    orderId,
                    method: PAYMENTMETHOD.CASH_ON_DELIVERY,
                },
                select: { id: true }
            });

            if (existingPayment) {
                throw new BadRequestException(`Cash payment already recorded for order ${orderId}`);
            }

            // Record cash payment
            await this.savePayment({
                orderId,
                provider: 'cash',
                providerRef: `CASH-${orderId}-${Date.now()}`,
                amount: new Prisma.Decimal(amount),
                currency,
                status: PAYMENTSTATUS.PAID,
                method: PAYMENTMETHOD.CASH_ON_DELIVERY,
                capturedAt: new Date(),
            });

            this.logger.log(
                `Cash payment recorded for order ${orderId}`,
                PaymentService.name
            );
        } catch (error) {
            this.logger.error(
                `Failed to record cash payment for order ${orderId}`,
                error.stack,
                PaymentService.name
            );
            throw error;
        }
    }

    async refundPayment(paymentId: string, amount: number): Promise<boolean> {
        return this.paymentProvider.refundPayment(paymentId, amount);
    }
}
