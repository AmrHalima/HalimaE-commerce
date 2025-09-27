import { OmitType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from '../../../customer/dto';


export class ResponseAuthCustomerDto extends OmitType(CreateCustomerDto, ['password', 'provider', 'providerId'] as const) {
    readonly access_token: string;
}