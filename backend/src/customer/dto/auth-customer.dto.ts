import { OmitType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-cusotmer.dto';

export class AuthCustomerDto extends OmitType(CreateCustomerDto, ['name'])
{ }