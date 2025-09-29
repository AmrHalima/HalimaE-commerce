import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, LoggerService } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { join } from 'path';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LogService } from '../src/logger/log.service';
import { NestExpressApplication } from '@nestjs/platform-express';

// Global counter for unique test data
let testCounter = 0;

export function getUniqueTestData(prefix: string = 'test') {
    const timestamp = Date.now();
    const counter = ++testCounter;
    return {
        email: `${prefix}-${counter}-${timestamp}@test.com`,
        slug: `${prefix}-${counter}-${timestamp}`,
        name: `${prefix} ${counter} ${timestamp}`,
        sku: `${prefix.toUpperCase()}-SKU-${counter}-${timestamp}`,
    };
}

async function cleanDatabase(prisma: PrismaService) {
    // Delete in order of dependency - more comprehensive cleanup
    await prisma.orderItem.deleteMany().catch(() => {});
    await prisma.payment.deleteMany().catch(() => {});
    await prisma.shipment.deleteMany().catch(() => {});
    await prisma.order.deleteMany().catch(() => {});
    await prisma.cartItem.deleteMany().catch(() => {});
    await prisma.cart.deleteMany().catch(() => {});
    await prisma.variantPrice.deleteMany().catch(() => {});
    await prisma.variantInventory.deleteMany().catch(() => {});
    await prisma.productVariant.deleteMany().catch(() => {});
    await prisma.productImage.deleteMany().catch(() => {});
    await prisma.collectionProduct.deleteMany().catch(() => {});
    await prisma.product.deleteMany().catch(() => {});
    await prisma.collection.deleteMany().catch(() => {});
    await prisma.category.deleteMany().catch(() => {});
    await prisma.address.deleteMany().catch(() => {});
    await prisma.customer.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.role.deleteMany().catch(() => {});
}

export async function setupE2ETest() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            AppModule,
            // This module is what allows the test server to serve the uploaded images.
            // It maps the URL path '/images/products' to the physical directory 'public/uploads/products'.
            // ServeStaticModule.forRoot({
            //     // The URL path to serve static files from
            //     serveRoot: '/images/products',
            //     // The physical directory where the files are located
            //     rootPath: join(__dirname, '..', 'public', 'uploads', 'products'),
            // }),
        ],
    })
    .compile()

    const app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useLogger(app.get<LoggerService>(LogService));
    // This is the key change. It maps the physical directory where images are stored
    // to the URL path that the ProductImageService generates.
    app.useStaticAssets(join(__dirname, '..', 'public', 'uploads'), {
        prefix: '/images/',
    });
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
