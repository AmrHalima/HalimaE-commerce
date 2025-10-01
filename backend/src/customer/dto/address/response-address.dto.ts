import { ApiProperty } from "@nestjs/swagger";
import { CreateAddressDto } from "./create-address.dto";

export class ResponseAddressDto extends CreateAddressDto {
    @ApiProperty({
        description: 'Address ID',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    readonly id: string;

    @ApiProperty({
        description: 'Customer ID this address belongs to',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    readonly customerId: string;

    @ApiProperty({
        description: 'Address creation date',
        example: '2024-01-01T00:00:00.000Z'
    })
    readonly createdAt: Date;

    @ApiProperty({
        description: 'Address last update date',
        example: '2024-01-01T00:00:00.000Z'
    })
    readonly updatedAt: Date;
}
