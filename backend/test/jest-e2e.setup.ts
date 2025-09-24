import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { join } from 'path';
import { ThrottlerGuard } from '@nestjs/throttler';

async function cleanDatabase(prisma: PrismaService) {
    // Delete in order of dependency
    await prisma.variantPrice.deleteMany();
    await prisma.variantInventory.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    // Assuming these models exist based on schema comments
    await prisma.address.deleteMany();
    // await prisma.cart.deleteMany();
    // await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
}

export async function setupE2ETest() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            AppModule,
            // This module is what allows the test server to serve the uploaded images.
            // It maps the URL path '/images/products' to the physical directory 'public/uploads/products'.
            ServeStaticModule.forRoot({
                // The URL path to serve static files from
                serveRoot: '/images/products',
                // The physical directory where the files are located
                rootPath: join(__dirname, '..', 'public', 'uploads', 'products'),
            }),
        ],
    })
    .compile()

    const app: INestApplication = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useLogger(new Logger('E2E'));
    app.setGlobalPrefix('/api');
    await app.init();

    const prisma = app.get<PrismaService>(PrismaService);

    await cleanDatabase(prisma);

    return { app, prisma };
}

export async function teardownE2ETest(app: INestApplication, prisma: PrismaService) {
    await cleanDatabase(prisma);
    await app.close();
}
