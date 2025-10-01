import { CreateUserDto } from "./create-user.dto";
import { OmitType, ApiProperty } from "@nestjs/swagger";

export class UserResponseDto extends OmitType(CreateUserDto, ['password', 'provider', 'providerId', 'roleId'] as const) {
    @ApiProperty({
        description: 'User role information',
        example: { name: 'admin' },
        nullable: true
    })
    readonly role: { name: string } | null;

    @ApiProperty({
        description: 'JWT access token for authentication',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    readonly access_token: string;
}
