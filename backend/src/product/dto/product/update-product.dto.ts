import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends OmitType(PartialType(CreateProductDto), ['variants'])
{ }