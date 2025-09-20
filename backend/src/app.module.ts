import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        UsersModule,
        AuthModule,
        ProductModule,
        CategoryModule,
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 3,
                },
                {
                    name: 'medium',
                    ttl: 10000,
                    limit: 20
                },
                {
                    ttl: 60000,
                    limit: 100
                }
            ],
        }),
    ],
    providers: [
        {
            provide: 'APP_NAME',
            useValue: 'HalimaE-commerce',
        },
        {
            provide: 'APP_VERSION',
            useValue: '1.0.0',
        },
        {
            provide: 'APP_DESCRIPTION',
            useValue: 'HalimaE-commerce',
        },
        {
            provide: 'APP_LICENSE',
            useValue: 'MIT',
        },
        {
            provide: 'APP_LICENSE_URL',
            useValue: 'https://opensource.org/licenses/MIT',
        },
        {
            provide: 'APP_GUARD',
            useClass: ThrottlerGuard
        }
    ],
})
export class AppModule {}
