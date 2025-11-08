import { INestApplication, LoggerService } from '@nestjs/common';
import request from 'supertest';
import { setupE2ETest, teardownE2ETest } from './jest-e2e.setup';
import * as argon2 from 'argon2';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateAddressDto } from '../src/customer/dto';
import { LogService } from '../src/logger/log.service';
import { extractAuthTokenFromResponse, expectSuccessResponse, expectErrorResponse } from './test-utils';

describe('CustomerController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let customerToken: string;
    let addressId: string;
    let logger: LoggerService;

    beforeAll(async () => {
        ({ app, prisma } = await setupE2ETest());
        logger = app.get<LoggerService>(LogService);

        // 1. Create Roles
        let role = await prisma.role.findFirst({
            where: { name: 'admin' },
            select: { id: true }
        });
        if (!role) {
            role = await prisma.role.create({ data: { name: 'admin' }, select: { id: true } });
        }

        const admin = await prisma.user.upsert({
            where: { email: 'customeradmin@test.com' },
            update: {},
            create: {
                name: 'CustomerAdmin test',
                email: 'customeradmin@test.com',
                passwordHash: await argon2.hash('password'),
                roleId: role.id,
            },
            select: {
                id: true,
                email: true,
                passwordHash: true
            }
        });

        adminToken = extractAuthTokenFromResponse(await request(app.getHttpServer())
            .post('/api/admin/auth/login')
            .send({ email: admin.email, password: 'password' }));

        expect(adminToken).toBeDefined();
    });

    afterAll(async () => {
        await teardownE2ETest(app, prisma);
    });


    describe('POST /customers/auth', () => {
        it('should create a new customer', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/customers/auth/signup')
                .send({
                    name: 'Customer test',
                    email: 'customer@test.com',
                    password: 'password',
                    phone: '1234567890'
                });
            logger.debug?.(`Response: ${JSON.stringify(response.body)}`, 'CustomerAuthController');

            const data = expectSuccessResponse<any>(response, 201);
            expect(data.name).toBe('Customer test');
            expect(data.email).toBe('customer@test.com');
            expect(data.phone).toBe('1234567890');
            expect(data).toHaveProperty('access_token');
            customerToken = data.access_token;
        });

        it('should login a customer', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/customers/auth/login')
                .send({ email: 'customer@test.com', password: 'password' });

            const data = expectSuccessResponse<any>(response, 200);
            expect(data).toHaveProperty('access_token');
            customerToken = data.access_token;
        });
    });

    describe('GET /customers/me', () => {
        it('should get the current customer', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/me')
                .set('Authorization', `Bearer ${customerToken}`);

            const data = expectSuccessResponse<any>(response, 200);
            expect(data).toHaveProperty('id');
            expect(data.name).toBe('Customer test');
            expect(data.email).toBe('customer@test.com');
            expect(data.phone).toBe('1234567890');
        });
    });

    describe('PATCH /customers/me', () => {
        it('should update the current customer', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/customers/me')
                .set('Authorization', `Bearer ${customerToken}`)    
                .send({ name: 'Customer test updated' });
                
            const data = expectSuccessResponse<any>(response, 200);
            expect(data.name).toBe('Customer test updated');
        });
    });

    describe('GET /customers', () => {
        it('should get all customers for admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/admin/all')
                .set('Authorization', `Bearer ${adminToken}`);

            const data = expectSuccessResponse<any>(response, 200);
            expect(data.data).toBeInstanceOf(Array);
        });

        it('should not get all customers for customer', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/admin/all')
                .set('Authorization', `Bearer ${customerToken}`);
                
            expectErrorResponse(response, 401); // or 403 depending on guard implementation, JwtUserGuard will fail validation -> 401
        });

        it('should get all customers with pagination', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/admin/all?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`);
                
            const data = expectSuccessResponse<any>(response, 200);
            expect(data.data).toBeInstanceOf(Array);
            expect(data.meta.total).toBeGreaterThan(0);
            expect(data.meta.totalPages).toBeGreaterThan(0);
        });

        it('should get all customers with search', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/admin/all?search=test')
                .set('Authorization', `Bearer ${adminToken}`);
                
            const data = expectSuccessResponse<any>(response, 200);
            expect(data.data).toBeInstanceOf(Array);
            expect(data.data.length).toBeGreaterThan(0);
            expect(data.data[0].name).toContain('test');
        });

        it('should get all customers with sort', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/admin/all?sort=name&order=desc')
                .set('Authorization', `Bearer ${adminToken}`);

            const data = expectSuccessResponse<any>(response, 200);
            expect(data.data).toBeInstanceOf(Array);
            
            const sortedNames = data.data.map((customer: any) => customer.name);
            
            for (let i = 0; i < sortedNames.length - 1; i++) {
                expect(sortedNames[i]).toBeGreaterThanOrEqual(sortedNames[i + 1]);
            }
        });
    });

    describe('POST /customers/addresses', () => {
        it('should create a new address for the current customer', async () => {
            const address: CreateAddressDto = {
                firstName: 'John',
                lastName: 'Doe',
                phone: '1234567890',
                line1: '123 Main St',
                line2: 'Apt 4B',
                city: 'New York',
                postalCode: '10001',
                country: 'USA',
                isDefault: true,
            }
            const response = await request(app.getHttpServer())
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(address);
            
            const data = expectSuccessResponse<any>(response, 201);
            expect(data).toHaveProperty('id');
            expect(data.firstName).toBe(address.firstName);
            expect(data.lastName).toBe(address.lastName);
            expect(data.phone).toBe(address.phone);
            expect(data.line1).toBe(address.line1);
            expect(data.line2).toBe(address.line2);
            expect(data.city).toBe(address.city); 
            expect(data.postalCode).toBe(address.postalCode);
            expect(data.country).toBe(address.country);
            expect(data.isDefault).toBe(address.isDefault);

            addressId = data.id;
        });
        
        it('should return 400 if required fields are missing', async () => {
            const address = {
                firstName: 'John',
                // missing lastName  
                phone: '1234567890',
                line1: '123 Main St',
                line2: 'Apt 4B',
                city: 'New York',
                country: 'USA',
                isDefault: true,
            }

            const response = await request(app.getHttpServer())
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(address);

            expectErrorResponse(response, 400);
        });

        it('should return 400 if postal code is invalid', async () => {
            const address: CreateAddressDto = {
                firstName: 'John',
                lastName: 'Doe',
                phone: '1234567890',
                line1: '123 Main St',
                line2: 'Apt 4B',
                city: 'New York',
                country: 'USA',
                postalCode: '1234567890', // Invalid postal code
                isDefault: true,
            }

            const response = await request(app.getHttpServer())
                .post('/api/customers/addresses')
                .set('Authorization', `Bearer ${customerToken}`)
                .send(address);
            expectErrorResponse(response, 400);
        });
    });

    describe('GET /customers/addresses/:id', () => {
        it('should get an address for the current customer', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/customers/addresses/${addressId}`)
                .set('Authorization', `Bearer ${customerToken}`);

            const data = expectSuccessResponse<any>(response, 200);
            expect(data).toHaveProperty('id');
            expect(data.firstName).toBe('John');
            expect(data.lastName).toBe('Doe');            
        });

        it('should return 404 if address not found', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/addresses/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${customerToken}`);

            expectErrorResponse(response, 404);
        });


        it('should return 401 if not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/customers/addresses/${addressId}`);
            expectErrorResponse(response, 401);
        });
    });

    describe('GET /customers/addresses', () => {
        it('should get all addresses for the current customer', async () => {
            const response = await request(app.getHttpServer())
               .get('/api/customers/addresses')
               .set('Authorization', `Bearer ${customerToken}`);
               
            const data = expectSuccessResponse<any>(response, 200);
            expect(data).toHaveLength(1);
        });

        it('should return 401 if not authenticated' , async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/addresses');

            expectErrorResponse(response, 401);
        });
    });
});