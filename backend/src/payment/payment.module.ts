import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { HttpModule } from '@nestjs/axios';
import { PaymobProvider } from './payment-provider/paymob.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { LogModule } from '../logger/log.module';
import { PaymentController } from './payment.controller';

@Module({
    imports: [
        HttpModule,
        LogModule
    ],
    controllers: [PaymentController],
    providers: [
        {
            provide: 'IPaymentProvider',
            useClass: PaymobProvider
        },
        PaymentService
    ],
    exports: [PaymentService],
})
export class PaymentModule {}
