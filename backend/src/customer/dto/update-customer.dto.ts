import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateCustomerDto } from "./create-cusotmer.dto";

export class UpdateCustomerDto extends PartialType(OmitType(CreateCustomerDto, ['password'] as const)) {}