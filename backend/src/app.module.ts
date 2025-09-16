import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }), PrismaModule, UsersModule, AuthModule, ProductsModule],
})
export class AppModule {}
