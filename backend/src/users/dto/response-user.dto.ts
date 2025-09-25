import { CreateUserDto } from "./create-user.dto";
import { OmitType  } from "@nestjs/mapped-types";

export class UserResponseDto extends OmitType(CreateUserDto, ['password', 'provider', 'providerId', 'roleId'] as const) {
    readonly role: { name: string } | null;
    readonly access_token: string;
}
