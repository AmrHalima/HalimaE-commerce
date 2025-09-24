import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupE2ETest, teardownE2ETest } from './jest-e2e.setup';
import * as argon2 from 'argon2';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateAddressDto } from '../src/customer/dto';

describe('CustomerController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let customerToken: string;
    let addressId: string;

    beforeAll(async () => {
        ({ app, prisma } = await setupE2ETest());

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

        adminToken = (await request(app.getHttpServer())
            .post('/api/admin/auth/login')
            .send({ email: admin.email, password: 'password' })).body.access_token;

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

            expect(response.status).toBe(201);
            expect(response.body.customer).toHaveProperty('id');
            expect(response.body.customer.name).toBe('Customer test');
            expect(response.body.customer.email).toBe('customer@test.com');
            expect(response.body.customer.phone).toBe('1234567890');
            expect(response.body).toHaveProperty('access_token');
            customerToken = response.body.access_token;
        });

        it('should login a customer', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/customers/auth/login')
                .send({ email: 'customer@test.com', password: 'password' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('access_token');
            customerToken = response.body.access_token;
        });
    });

    describe('GET /customers/me', () => {
        it('should get the current customer', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/me')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe('Customer test');
            expect(response.body.email).toBe('customer@test.com');
            expect(response.body.phone).toBe('1234567890');
        });
    });

    describe('PATCH /customers/me', () => {
        it('should update the current customer', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/customers/me')
                .set('Authorization', `Bearer ${customerToken}`)    
                .send({ name: 'Customer test updated' });
                
            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Customer test updated');
        });
    });

    describe('GET /customers', () => {
        it('should get all customers for admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should not get all customers for customer', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers')
                .set('Authorization', `Bearer ${customerToken}`);
                
            expect(response.status).toBe(401); // or 403 depending on guard implementation, JwtUserGuard will fail validation -> 401
        });

        it('should get all customers with pagination', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`);
                
            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta.total).toBeGreaterThan(0);
            expect(response.body.meta.totalPages).toBeGreaterThan(0);
        });

        it('should get all customers with search', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers?search=test')
                .set('Authorization', `Bearer ${adminToken}`);
                
            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].name).toContain('test');
        });

        it('should get all customers with sort', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers?sort=name&order=desc')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            
            const sortedNames = response.body.data.map((customer: any) => customer.name);
            
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
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.firstName).toBe(address.firstName);
            expect(response.body.lastName).toBe(address.lastName);
            expect(response.body.phone).toBe(address.phone);
            expect(response.body.line1).toBe(address.line1);
            expect(response.body.line2).toBe(address.line2);
            expect(response.body.city).toBe(address.city); 
            expect(response.body.postalCode).toBe(address.postalCode);
            expect(response.body.country).toBe(address.country);
            expect(response.body.isDefault).toBe(address.isDefault);

            addressId = response.body.id;
        });
        
        it('should return 400 if required fields are missing', async () => {
            const address = {
                firstName: 'John',
                lastName: 'Doe',
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

            expect(response.status).toBe(400);
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
            expect(response.status).toBe(400);
        });
    });

    describe('GET /customers/addresses/:id', () => {
        it('should get an address for the current customer', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/customers/addresses/${addressId}`)
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.firstName).toBe('John');
            expect(response.body.lastName).toBe('Doe');            
        });

        it('should return 404 if address not found', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/addresses/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(response.status).toBe(404);
        });


        it('should return 401 if not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/customers/addresses/${addressId}`);
            expect(response.status).toBe(401);
        });
    });

    describe('GET /customers/addresses', () => {
        it('should get all addresses for the current customer', async () => {
            const response = await request(app.getHttpServer())
               .get('/api/customers/addresses')
               .set('Authorization', `Bearer ${customerToken}`);
               
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
        });

        it('should return 401 if not authenticated' , async () => {
            const response = await request(app.getHttpServer())
                .get('/api/customers/addresses');

            expect(response.status).toBe(401);
        });
    });
});