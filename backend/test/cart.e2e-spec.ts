import { INestApplication, LoggerService } from '@nestjs/common';
import request from 'supertest';
import { setupE2ETest, teardownE2ETest, getUniqueTestData } from './jest-e2e.setup';
import * as argon2 from 'argon2';
import { PrismaService } from '../src/prisma/prisma.service';
import { LogService } from '../src/logger/log.service';
import { Status } from '@prisma/client';

describe('CartController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let customerToken: string;
    let customerId: string;
    let categoryId: string;
    let productId: string;
    let variantId: string;
    let cartItemId: string;
    let logger: LoggerService;
    let testData: any;
    let categoryData: any;
    let productData: any;
    let variantData: any;

    beforeAll(async () => {
        ({ app, prisma } = await setupE2ETest());
        logger = app.get<LoggerService>(LogService);

        testData = getUniqueTestData('cart');

        // Create test customer
        const customer = await prisma.customer.create({
            data: {
                name: testData.name,
                email: testData.email,
                passwordHash: await argon2.hash('password'),
                phone: '1234567890',
                status: Status.ACTIVE,
            },
        });
        customerId = customer.id;

        // Login customer to get token
        const loginResponse = await request(app.getHttpServer())
            .post('/api/customers/auth/login')
            .send({ email: testData.email, password: 'password' });

        customerToken = loginResponse.body.access_token;
        expect(customerToken).toBeDefined();

        // Create test category
        categoryData = getUniqueTestData('category');
        const category = await prisma.category.create({
            data: {
                name: categoryData.name,
                slug: categoryData.slug,
            },
        });
        categoryId = category.id;

        // Create test product
        productData = getUniqueTestData('product');
        const product = await prisma.product.create({
            data: {
                name: productData.name,
                slug: productData.slug,
                description: 'Test product description',
                status: Status.ACTIVE,
                categoryId: categoryId,
            },
        });
        productId = product.id;

        // Create test variant
        variantData = getUniqueTestData('variant');
        const variant = await prisma.productVariant.create({
            data: {
                productId: productId,
                sku: variantData.sku,
                size: 'M',
                color: 'Blue',
                material: 'Cotton',
                isActive: true,
            },
        });
        variantId = variant.id;

        // Create variant price
        await prisma.variantPrice.create({
            data: {
                variantId: variantId,
                currency: 'USD',
                amount: 29.99,
                compareAt: 39.99,
            },
        });

        // Create variant inventory
        await prisma.variantInventory.create({
            data: {
                variantId: variantId,
                stockOnHand: 100,
            },
        });

        // Create product image
        await prisma.productImage.create({
            data: {
                productId: productId,
                url: 'https://example.com/test-image.jpg',
                alt: 'Test product image',
                sort: 1,
            },
        });
    }, 30000);

    afterAll(async () => {
        await teardownE2ETest(app, prisma);
    });

    describe('POST /cart/items', () => {
        it('should add item to cart', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    variantId: variantId,
                    qty: 2,
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.qty).toBe(2);
            expect(response.body.variantId).toBe(variantId);

            cartItemId = response.body.id;
        });

        it('should update quantity if item already exists in cart', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    variantId: variantId,
                    qty: 1,
                });

            expect(response.status).toBe(201);
            expect(response.body.qty).toBe(3); // 2 + 1
        });

        it('should return 400 for invalid data', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    variantId: variantId,
                    qty: 0, // Invalid quantity
                });

            expect(response.status).toBe(400);
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/cart/items')
                .send({
                    variantId: variantId,
                    qty: 1,
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /cart', () => {
        it('should get customer cart with full details', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('customerId', customerId);
            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('totalItems', 3);
            expect(response.body.items).toHaveLength(1);

            const item = response.body.items[0];
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('qty', 3);
            expect(item.variant).toHaveProperty('id', variantId);
            expect(item.variant).toHaveProperty('sku', variantData.sku);
            expect(item.variant).toHaveProperty('size', 'M');
            expect(item.variant).toHaveProperty('color', 'Blue');
            expect(item.variant.product).toHaveProperty('name', productData.name);
            expect(item.variant.prices).toHaveLength(1);
            expect(item.variant.prices[0]).toHaveProperty('amount');
            expect(item.variant.prices[0]).toHaveProperty('currency', 'USD');
        });

        it('should return 404 if customer has no cart', async () => {
            // Create another customer
            const noCartData = getUniqueTestData('nocart');
            const newCustomer = await prisma.customer.create({
                data: {
                    name: noCartData.name,
                    email: noCartData.email,
                    passwordHash: await argon2.hash('password'),
                    status: Status.ACTIVE,
                },
            });

            const loginResponse = await request(app.getHttpServer())
                .post('/api/customers/auth/login')
                .send({ email: noCartData.email, password: 'password' });

            const newCustomerToken = loginResponse.body.access_token;

            const response = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${newCustomerToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Cart not found');
        });

        it('should return 401 if not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /cart/checkout', () => {
        it('should get lightweight cart for checkout', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart/checkout')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('customerId', customerId);
            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('totalItems', 3);

            const item = response.body.items[0];
            expect(item.variant).toHaveProperty('id', variantId);
            expect(item.variant).toHaveProperty('sku', variantData.sku);
            expect(item.variant.product).toHaveProperty('name', productData.name);
            expect(item.variant.prices).toHaveLength(1);

            // Should not have images, detailed product info, etc.
            expect(item.variant.product).not.toHaveProperty('images');
            expect(item.variant.product).not.toHaveProperty('description');
        });
    });

    describe('GET /cart/count', () => {
        it('should get cart items count', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart/count')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('count', 3);
        });
    });

    describe('GET /cart/total', () => {
        it('should calculate cart total in USD', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart/total')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total', 89.97); // 29.99 * 3
            expect(response.body).toHaveProperty('currency', 'USD');
            expect(response.body).toHaveProperty('itemCount', 3);
        });

        it('should calculate cart total in specified currency', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart/total?currency=USD')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total', 89.97);
            expect(response.body).toHaveProperty('currency', 'USD');
        });
    });

    describe('PATCH /cart/items/:itemId', () => {
        it('should update cart item quantity', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ qty: 5 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('qty', 5);
        });

        it('should remove item when quantity is 0', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ qty: 0 });

            expect(response.status).toBe(200);

            // Verify item is removed
            const cartResponse = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(cartResponse.body.items).toHaveLength(0);
            expect(cartResponse.body.totalItems).toBe(0);
        });

        it('should return 404 for non-existent item', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/cart/items/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ qty: 1 });

            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid quantity', async () => {
            // Add item back first
            await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    variantId: variantId,
                    qty: 1,
                });

            const response = await request(app.getHttpServer())
                .patch(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${customerToken}`)
                .send({ qty: -1 });

            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /cart/items/:itemId', () => {
        it('should remove item from cart', async () => {
            // First get current cart to find item ID
            const cartResponse = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            const itemId = cartResponse.body.items[0].id;

            const response = await request(app.getHttpServer())
                .delete(`/api/cart/items/${itemId}`)
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);

            // Verify item is removed
            const updatedCartResponse = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(updatedCartResponse.body.items).toHaveLength(0);
        });

        it('should return 404 for non-existent item', async () => {
            const response = await request(app.getHttpServer())
                .delete('/api/cart/items/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /cart', () => {
        it('should clear entire cart', async () => {
            // Add items to cart first
            await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    variantId: variantId,
                    qty: 2,
                });

            const response = await request(app.getHttpServer())
                .delete('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Cart cleared successfully');

            // Verify cart is empty
            const cartResponse = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(cartResponse.body.items).toHaveLength(0);
        });

        it('should return 404 for non-existent cart', async () => {
            // Create another customer without cart
            const emptyCartData = getUniqueTestData('emptycart');
            const newCustomer = await prisma.customer.create({
                data: {
                    name: emptyCartData.name,
                    email: emptyCartData.email,
                    passwordHash: await argon2.hash('password'),
                    status: Status.ACTIVE,
                },
            });

            const loginResponse = await request(app.getHttpServer())
                .post('/api/customers/auth/login')
                .send({ email: emptyCartData.email, password: 'password' });

            const newCustomerToken = loginResponse.body.access_token;

            const response = await request(app.getHttpServer())
                .delete('/api/cart')
                .set('Authorization', `Bearer ${newCustomerToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('Cart edge cases', () => {
        it('should handle multiple variants in cart', async () => {
            // Create another variant
            const variant2 = await prisma.productVariant.create({
                data: {
                    productId: productId,
                    sku: getUniqueTestData('sku'),
                    size: 'L',
                    color: 'Red',
                    material: 'Cotton',
                    isActive: true,
                },
            });

            await prisma.variantPrice.create({
                data: {
                    variantId: variant2.id,
                    currency: 'USD',
                    amount: 34.99,
                },
            });

            // Add both variants to cart
            await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    variantId: variantId,
                    qty: 2,
                });

            await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    variantId: variant2.id,
                    qty: 1,
                });

            const response = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body.items).toHaveLength(2);
            expect(response.body.totalItems).toBe(3); // 2 + 1

            // Check total calculation
            const totalResponse = await request(app.getHttpServer())
                .get('/api/cart/total')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(totalResponse.body.total).toBe(94.97); // (29.99 * 2) + (34.99 * 1)
        });

        it('should handle concurrent cart operations', async () => {
            // Clear cart first
            await request(app.getHttpServer())
                .delete('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            // Simulate concurrent add operations
            const promises = Array.from({ length: 5 }, () =>
                request(app.getHttpServer())
                    .post('/api/cart/items')
                    .set('Authorization', `Bearer ${customerToken}`)
                    .send({
                        variantId: variantId,
                        qty: 1,
                    })
            );

            const results = await Promise.all(promises);
            
            // Check that all requests succeeded
            results.forEach(result => {
                expect(result.status).toBe(201);
            });

            const response = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            
            // With proper transactions, all 5 additions should accumulate into a single item
            // The total quantity should be 5, regardless of how many cart items exist
            const totalQuantity = response.body.items.reduce((sum: number, item: any) => sum + item.qty, 0);
            expect(totalQuantity).toBe(5);
            expect(response.body.totalItems).toBe(5);
        });
    });
});