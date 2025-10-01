import { OmitType, ApiProperty } from '@nestjs/swagger';
import { CreateCustomerDto } from '../../../customer/dto';


export class ResponseAuthCustomerDto extends OmitType(CreateCustomerDto, ['password', 'provider', 'providerId'] as const) {
    @ApiProperty({
        description: 'JWT access token for authentication',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    readonly access_token: string;
}