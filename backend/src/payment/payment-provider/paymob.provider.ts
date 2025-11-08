import { BadGatewayException, Injectable, UnauthorizedException } from "@nestjs/common";
import { IPaymentProvider } from "../interfaces";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { catchError, lastValueFrom, retry } from "rxjs";
import { PAYMENTMETHOD } from "@prisma/client";
import { BillingAddressDto, ParsedWebhookData } from "../dto";
import { LogService } from "../../logger/log.service";
import * as crypto from "crypto";

@Injectable()
export class PaymobProvider implements IPaymentProvider {
    public  readonly providerName           : string = 'PAYMOB';
    private readonly base_url               : string;
    private readonly api_key                : string;
    private readonly iframe_id              : number;
    private readonly card_integeration_id   : number;
    private readonly wallet_integeration_id : number;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly logger: LogService
    ) {
        this.base_url               = configService.get<string>('PAYMOB_BASE_URL')!;
        this.api_key                = configService.get<string>('PAYMOB_API_KEY')!;
        this.iframe_id              = configService.get<number>('PAYMOB_IFRAME_ID')!;
        this.card_integeration_id   = configService.get<number>('PAYMOB_CARD_INTEGRATION_ID')!;
        this.wallet_integeration_id = configService.get<number>('PAYMOB_WALLET_INTEGRATION_ID')!;
    }

    async createPaymentIntent(
        amount        : number,
        currency      : string,
        method        : PAYMENTMETHOD,
        billing_data? : BillingAddressDto
    ): Promise<string | null> {
        try {
            const auth_token    = await this.authenticate();
            const paymobOrderId = await this.createOrder(auth_token, amount, currency, []);

            if (method === PAYMENTMETHOD.CARD) {
                const paymentKey = await this.generatePaymentKey(
                    auth_token, paymobOrderId, amount, currency, billing_data
                );
                return `${this.base_url}/acceptance/iframes/${this.iframe_id}?payment_token=${paymentKey}`;
            } else if (method === PAYMENTMETHOD.WALLET) {
                // Wallet payments use different API endpoint
                return await this.createWalletPayment(
                    auth_token, paymobOrderId, amount, currency, billing_data
                );
            } else if (method === PAYMENTMETHOD.CASH_ON_DELIVERY) {
                // Cash on delivery doesn't need a payment URL
                return null;
            }

            throw new Error(`Unsupported payment method: ${method}`);
        } catch (error) {
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }
    }

    /**
     * Handle Paymob webhook and parse payment data
     * Reference: https://docs.paymob.com/docs/transaction-webhooks
     */
    async handleWebhook(payload: any, signature: string, headers: any): Promise<ParsedWebhookData> {
        try {
            const calculatedHmac = crypto
                .createHmac('sha512', this.api_key)
                .update(JSON.stringify(payload))
                .digest('hex');

            if (calculatedHmac !== signature) {
                throw new UnauthorizedException('Invalid webhook signature');
            }

            // Parse Paymob webhook structure
            const obj = payload.obj;
            
            if (!obj) {
                throw new Error('Invalid webhook payload: missing obj');
            }

            const status = obj.success && !obj.pending ? 'PAID' : 'FAILED';

            // Determine payment method from source_data
            let method: 'CARD' | 'WALLET' = 'CARD';
            const sourceType = obj.source_data?.type?.toLowerCase();
            const sourceSubType = obj.source_data?.sub_type?.toLowerCase() || '';
            
            // Check if it's a wallet payment (type=wallet or sub_type contains wallet/cash keywords)
            if (sourceType === 'wallet' || 
                sourceSubType.includes('wallet') || 
                sourceSubType.includes('cash')) {
                method = 'WALLET';
            }

            const orderId = obj.order?.merchant_order_id || String(obj.order?.id);

            const parsedData: ParsedWebhookData = {
                orderId,
                transactionId: String(obj.id),
                amount: obj.amount_cents / 100, // Convert cents to currency units
                currency: obj.currency,
                status,
                method,
                capturedAt: new Date(obj.created_at),
            };

            return parsedData;
        } catch (error) {
            throw new Error(`Failed to parse webhook: ${error.message}`);
        }
    }

    refundPayment(paymentId: string, amount: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    private async authenticate(): Promise<string> {
        const authRes = await lastValueFrom(
            this.httpService.post(`${this.base_url}/auth/tokens`, {
                api_key: this.api_key,
            }).pipe(
                retry(3),
                catchError((error) => {
                    this.logger.error(
                        `Failed to authenticate with Paymob: ${error.message}`,
                        error.stack,
                        PaymobProvider.name
                    );
                    throw new BadGatewayException(`Failed to authenticate with Paymob`);
                })
            )
        );

        const auth_token = authRes.data.token;

        return auth_token;
    }

    private async createOrder(
        authToken       : string,
        amount          : number,
        currency        : string,
        items           : any[],
    ): Promise<string> {
        const orderRes = await lastValueFrom(
            this.httpService.post(`${this.base_url}/ecommerce/orders`, {
                auth_token: authToken,
                delivery_needed: false,
                amount_cents: amount * 100,
                currency: currency,
                items: items || []
            }).pipe(
                retry(3),
                catchError((error) => {
                    this.logger.error(
                        `Failed to create order: ${error.message}`,
                        error.stack,
                        PaymobProvider.name
                    );
                    throw new BadGatewayException(`Failed to create payment order`);
                })
            )
        );

        return orderRes.data.id;
    }

    /**
     * Transform billing data to Paymob format
     */
    private transformBillingData(billing_data?: BillingAddressDto) {
        if (!billing_data) {
            return {
                first_name: "NA",
                last_name: "NA",
                email: "NA",
                phone_number: "NA",
                apartment: "NA",
                floor: "NA",
                street: "NA",
                building: "NA",
                shipping_method: "NA",
                postal_code: "NA",
                city: "NA",
                country: "NA",
                state: "NA"
            };
        }

        return {
            first_name: billing_data.firstName,
            last_name: billing_data.lastName,
            email: billing_data.email || "NA",
            phone_number: billing_data.phone,
            apartment: billing_data.line2 || "NA",
            floor: "NA",
            street: billing_data.line1,
            building: "NA",
            shipping_method: "NA",
            postal_code: billing_data.postalCode,
            city: billing_data.city,
            country: billing_data.country,
            state: "NA"
        };
    }

    private async generatePaymentKey(
        authToken       : string,
        paymobOrderId   : string,
        amount          : number,
        currency        : string,
        billing_data?   : BillingAddressDto
    ): Promise<string> {
        const paymentKeyRes = await lastValueFrom(
            this.httpService.post(`${this.base_url}/acceptance/payment_keys`, {
                auth_token: authToken,
                amount_cents: amount * 100,
                expiration: 3600,
                order_id: paymobOrderId,
                billing_data: this.transformBillingData(billing_data),
                currency: currency,
                integration_id: this.card_integeration_id,
                lock_order_when_paid: "false"
            }).pipe(
                retry(3),
                catchError((error) => {
                    this.logger.error(
                        `Failed to generate payment key: ${error.message}`,
                        error.response?.data || error.stack,
                        PaymobProvider.name
                    );
                    throw new BadGatewayException(`Failed to generate payment key`);
                })
            )
        );

        return paymentKeyRes.data.token;
    }

    /**
     * Create wallet payment using Paymob API endpoint
     * Reference: https://docs.paymob.com/docs/mobile-wallets
     */
    private async createWalletPayment(
        authToken       : string,
        paymobOrderId   : string,
        amount          : number,
        currency        : string,
        billing_data?   : BillingAddressDto
    ): Promise<string> {
        try {
            const walletRes = await lastValueFrom(
                this.httpService.post(`${this.base_url}/acceptance/payments/pay`, {
                    source: {
                        identifier: billing_data?.phone,
                        subtype: "WALLET",
                    },
                    payment_token: await this.generateWalletToken(
                        authToken, paymobOrderId, amount, currency, billing_data
                    )
                }).pipe(
                    retry(3),
                    catchError((error) => {
                        this.logger.error(
                            `Failed to create wallet payment: ${error.message}`,
                            error.stack,
                            PaymobProvider.name
                        );
                        throw new BadGatewayException(`Failed to create wallet payment`);
                    })
                )
            );

            return walletRes.data.redirect_url;
        } catch (error) {
            throw new Error(`Failed to create wallet payment: ${error.message}`);
        }
    }

    /**
     * Generate payment token specifically for wallet payments
     */
    private async generateWalletToken(
        authToken       : string,
        paymobOrderId   : string,
        amount          : number,
        currency        : string,
        billing_data?   : BillingAddressDto
    ): Promise<string> {
        const tokenRes = await lastValueFrom(
            this.httpService.post(`${this.base_url}/acceptance/payment_keys`, {
                auth_token: authToken,
                amount_cents: amount * 100,
                expiration: 3600,
                order_id: paymobOrderId,
                billing_data: this.transformBillingData(billing_data),
                currency: currency,
                integration_id: this.wallet_integeration_id,
                lock_order_when_paid: "false"
            }).pipe(
                retry(3),
                catchError((error) => {
                    this.logger.error(
                        `Failed to generate wallet payment key: ${error.message}`,
                        error.stack,
                        PaymobProvider.name
                    );
                    throw new BadGatewayException(`Failed to generate wallet payment key`);
                })
            )
        );

        return tokenRes.data.token;
    }
}