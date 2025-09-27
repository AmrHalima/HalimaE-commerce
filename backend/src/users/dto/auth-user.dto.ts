import { OmitType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

export class LoginUserDto extends OmitType(CreateUserDto, ['roleId', 'name', 'provider', 'providerId']) { }