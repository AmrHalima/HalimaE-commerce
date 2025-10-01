import { OmitType } from '@nestjs/swagger';
import { CreateCustomerDto } from '../../../customer/dto/create-cusotmer.dto';

export class AuthCustomerDto extends OmitType(CreateCustomerDto, ['name'])
{ }