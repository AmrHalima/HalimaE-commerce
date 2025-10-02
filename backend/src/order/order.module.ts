import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartModule } from '../cart/cart.module';
import { LogModule } from '../logger/log.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, LogModule, CartModule],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService]
})
export class OrderModule {}
