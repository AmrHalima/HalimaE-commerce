/**
 * Webhook Simulator for Local Development
 * 
 * This script simulates Paymob webhooks for local testing
 * without needing ngrok or external tools.
 * 
 * Usage:
 *   node scripts/simulate-webhook.js <orderId> <status>
 * 
 * Examples:
 *   node scripts/simulate-webhook.js abc-123 success
 *   node scripts/simulate-webhook.js xyz-789 failed
 */

const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const API_KEY = process.env.PAYMOB_API_KEY || 'test-api-key';

// Parse command line arguments
const orderId = process.argv[2];
const status = process.argv[3] || 'success';
const paymentMethod = process.argv[4] || 'card'; // card or wallet

if (!orderId) {
    console.error('Error: Order ID is required');
    console.log('Usage: node scripts/simulate-webhook.js <orderId> <status> <paymentMethod>');
    console.log('Example: node scripts/simulate-webhook.js abc-123 success card');
    process.exit(1);
}

// Create webhook payload
const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid';

const webhookPayload = {
    obj: {
        id: Math.floor(Math.random() * 1000000), // Random transaction ID
        pending: false,
        success: isSuccess,
        amount_cents: 20000, // 200 EGP
        currency: 'EGP',
        created_at: new Date().toISOString(),
        order: {
            merchant_order_id: orderId,
            id: Math.floor(Math.random() * 1000000),
        },
        source_data: {
            type: paymentMethod === 'wallet' ? 'wallet' : 'card',
            sub_type: paymentMethod === 'wallet' ? 'vodafone_cash' : 'MasterCard',
        },
    },
};

// Generate HMAC signature
const signature = crypto
    .createHmac('sha512', API_KEY)
    .update(JSON.stringify(webhookPayload))
    .digest('hex');

// Send webhook
console.log('Sending Paymob webhook simulation...');
console.log('Order ID:', orderId);
console.log('Payment Method:', paymentMethod);
console.log('Status:', isSuccess ? 'SUCCESS' : 'FAILED');
console.log('Signature:', signature.substring(0, 32) + '...');
console.log('');

const webhookUrl = `${BASE_URL}/api/payment/webhook`;

axios
    .post(webhookUrl, webhookPayload, {
        headers: {
            'x-paymob-signature': signature,
            'Content-Type': 'application/json',
        },
    })
    .then((response) => {
        console.log('Webhook sent successfully!');
        console.log('Response:', response.data);
        console.log('');
        console.log('Payment has been recorded in the database');
        console.log('Check your database to verify the payment record');
    })
    .catch((error) => {
        console.error('Error sending webhook:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    });
