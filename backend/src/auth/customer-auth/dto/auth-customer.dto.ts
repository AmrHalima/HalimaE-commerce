import { OmitType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from '../../../customer/dto/create-cusotmer.dto';

export class AuthCustomerDto extends OmitType(CreateCustomerDto, ['name'])
{ }