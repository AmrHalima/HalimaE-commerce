/**
 * DTO for Paymob webhook payload structure
 */
export interface PaymobWebhookDto {
    type: string;
    obj: {
        id: number;
        success: boolean;
        amount_cents: number;
        currency: string;
        order: {
            id: number;
            merchant_order_id?: string;
        };
        source_data: {
            type: string;
            pan?: string;
            sub_type?: string;
        };
        payment_key_claims?: {
            billing_data?: {
                email?: string;
                phone_number?: string;
            };
        };
        created_at: string;
        pending: boolean;
    };
}

/**
 * Structured webhook data after parsing
 */
export interface ParsedWebhookData {
    orderId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'PAID' | 'FAILED';
    method: 'CARD' | 'WALLET';
    capturedAt: Date;
}
