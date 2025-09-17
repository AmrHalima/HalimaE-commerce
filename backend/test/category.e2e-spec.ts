import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CreateUserDto } from '../src/users/dto';
import { UsersService } from '../src/users/users.service';

describe('CategoryController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let employeeToken: string;
    let adminUserId: string;
    let employeeUserId: string;
    let adminRoleId: string;
    let employeeRoleId: string;

    // Store created category IDs to clean up
    const categoryIds: string[] = [];

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        prisma = app.get<PrismaService>(PrismaService);

        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        app.setGlobalPrefix('/api');
        await app.init();

        // Clean up database before tests
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();
        await prisma.role.deleteMany();

        // 1. Create Roles
        const adminRole = await prisma.role.create({ data: { name: 'admin' } });
        const employeeRole = await prisma.role.create({ data: { name: 'employee' } });
        adminRoleId = adminRole.id;
        employeeRoleId = employeeRole.id;

        // 2. Create Admin user directly to get the first token
        const adminDto: CreateUserDto = { name: 'Test Admin', email: 'admin-cat@test.com', password: 'password123', roleId: adminRoleId };
        // In a real scenario, the first admin is often seeded into the DB.
        // We simulate this by calling the user service directly.
        // We can't use the signup endpoint as it requires an admin token.
        const usersService = app.get(UsersService);
        const adminUser = await usersService.create(adminDto);
        adminUserId = adminUser.id;
        
        // 3. Log in as the seeded admin to get a token
        const adminLoginRes = await request(app.getHttpServer())
            .post('/api/admin/auth/login')
            .send({ email: adminDto.email, password: adminDto.password });
        adminToken = adminLoginRes.body.access_token;

        // 4. Use the admin token to create an employee user via the signup endpoint
        const employeeDto: CreateUserDto = { name: 'Test Employee', email: 'employee-cat@test.com', password: 'password123', roleId: employeeRoleId };
        await request(app.getHttpServer())
            .post('/api/admin/auth/signup')
            .send(employeeDto)
            .set('Authorization', `Bearer ${adminToken}`);

        // Retrieve the created employee to get their ID for cleanup
        const employeeUser = await prisma.user.findUnique({ where: { email: employeeDto.email } });
        expect(employeeUser).not.toBeNull();
        employeeUserId = employeeUser!.id;

        // 5. Log in as the new employee to get their token
        const employeeLoginRes = await request(app.getHttpServer())
            .post('/api/admin/auth/login')
            .send({ email: employeeDto.email, password: employeeDto.password });
        employeeToken = employeeLoginRes.body.access_token;
    }, 30000); // Set timeout to 30 seconds for setup

    afterAll(async () => {
        // Cleanup
        await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
        await prisma.user.deleteMany({ where: { id: { in: [adminUserId, employeeUserId] } } });
        await prisma.role.deleteMany({ where: { id: { in: [adminRoleId, employeeRoleId] } } });
        // No need to call prisma.$disconnect() here, app.close() handles it.
        await app.close();
    });

    describe('/categories (POST)', () => {
        it('should reject creation for unauthenticated user', () => {
        return request(app.getHttpServer())
            .post('/api/categories')
            .send({ name: "Women's Clothing", slug: 'womens-clothing' })
            .expect(401);
        });

        it('should create a new top-level category for an admin user', async () => {
            const dto = { name: "Women's Clothing", slug: 'womens-clothing' };
            const response = await request(app.getHttpServer())
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(dto)
                .expect(201);

            expect(response.body).toMatchObject(dto);
            expect(response.body.id).toBeDefined();
            categoryIds.push(response.body.id);
        });

        it('should create a new sub-category for an employee user', async () => {
            const parentCategory = await prisma.category.findUnique({
                where: { slug: 'womens-clothing' },
            });
            expect(parentCategory).not.toBeNull();
            const dto = { name: 'Dresses', slug: 'dresses', parentId: parentCategory!.id };
            
            const response = await request(app.getHttpServer())
                .post('/api/categories')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send(dto)
                .expect(201);
    
            expect(response.body).toMatchObject({ name: 'Dresses', slug: 'dresses' });
            expect(response.body.id).toBeDefined();
            categoryIds.push(response.body.id);
        });
    });

    describe('/categories (GET)', () => {
        it('should get a list of all categories', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/categories')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            expect(response.body.find((c: any) => c.slug === 'womens-clothing')).toBeDefined();
        });
    });

    describe('/categories/:id (GET)', () => {
        it('should get a single category by its ID', async () => {
            const womensCategory = await prisma.category.findFirst({ where: { slug: 'womens-clothing' } });
            expect(womensCategory).not.toBeNull();
            const response = await request(app.getHttpServer())
                .get(`/api/categories/${womensCategory!.id}`)
                .expect(200);

            expect(response.body.id).toBe(womensCategory!.id);
            expect(response.body.name).toBe("Women's Clothing");
        });

        it('should return 404 for a non-existent category ID', () => {
            return request(app.getHttpServer())
                .get('/api/categories/00000000-0000-0000-0000-000000000000')
                .expect(404);
        });
    });

    describe('/categories/slug/:slug (GET)', () => {
        it('should get a single category by its slug', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/categories/slug/dresses')
                .expect(200);

            expect(response.body.slug).toBe('dresses');
            expect(response.body.name).toBe('Dresses');
        });
    });

    describe('/categories/:id (PATCH)', () => {
        it('should update a category for an employee user', async () => {
            const dressesCategory = await prisma.category.findFirst({ where: { slug: 'dresses' } });
            expect(dressesCategory).not.toBeNull();
            const dto = { name: 'Summer Dresses' };
            const response = await request(app.getHttpServer())
                .patch(`/api/categories/${dressesCategory!.id}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .send(dto)
                .expect(200);

            expect(response.body.name).toBe('Summer Dresses');
            expect(response.body.slug).toBe('dresses'); // slug was not updated
        });
    });

    describe('/categories/:id (DELETE)', () => {
        it('should reject deletion for an employee user', async () => {
            const womensCategory = await prisma.category.findFirst({ where: { slug: 'womens-clothing' } });
            expect(womensCategory).not.toBeNull();
            return request(app.getHttpServer())
                .delete(`/api/categories/${womensCategory!.id}`)
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403); // Forbidden, as only admin can delete
        });
        
        it('shouldn not delete a parent category that has children', async () => {
            const womensCategory = await prisma.category.findFirst({ where: { slug: 'womens-clothing' } });
            expect(womensCategory).not.toBeNull();
            await request(app.getHttpServer())
                .delete(`/api/categories/${womensCategory!.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
        });
        
        it('should delete a category for an admin user', async () =>{
            const womensCategory = await prisma.category.findFirst({ where: { slug: 'dresses' } });
            expect(womensCategory).not.toBeNull();
            await request(app.getHttpServer())
                .delete(`/api/categories/${womensCategory!.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204); // no content

            // Verify it's gone
            await request(app.getHttpServer())
                .get(`/api/categories/${womensCategory!.id}`)
                .expect(404);
        });

        it('should return 404 when trying to delete a non-existent category', () => {
            return request(app.getHttpServer())
                .delete('/api/categories/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});