import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { AddressService } from './address.service';

@Module({
  providers: [CustomerService, AddressService],
  exports: [CustomerService],
  controllers: [CustomerController],
})
export class CustomerModule {}
