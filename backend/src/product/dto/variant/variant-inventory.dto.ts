import { IsNumber } from "class-validator";

export class VariantInventoryDto {
    @IsNumber()
    public stockOnHand: number;

}