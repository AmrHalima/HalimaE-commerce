import { Test, TestingModule } from '@nestjs/testing';
import { ProductVariantService } from './product-variant.service';

describe('ProductVariantService', () => {
  let service: ProductVariantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductVariantService],
    }).compile();

    service = module.get<ProductVariantService>(ProductVariantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
