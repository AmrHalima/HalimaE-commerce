import {
    Controller,
    Delete,
    Body,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Query,
    Get,
    Post,
    UseGuards
} from '@nestjs/common';
import {
    CreateCategoryDto,
    ResponseCategoriesFilteredDto,
    ResponseCategoryDto,
    UpdateCategoryDto
} from './dto';
import { CategoryService } from './category.service';
import { JwtUserGuard, RolesGuard } from '../auth/user-auth/guards';
import { Roles } from '../auth/user-auth/decorators';

@Controller('categories')
export class CategoryController {
    constructor(private categoryService: CategoryService) {}
    
    @Get()
    getAllCategories(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('orderBy') orderBy?: string,
        @Query('orderDirection') orderDirection?: string,
        @Query('search') search?: string
    ): Promise<ResponseCategoriesFilteredDto> {
        return this.categoryService.getAllPagenated(
            page,
            limit,
            orderBy,
            orderDirection,
            search
        );
    }

    @Get(':id')
    getCategoryById(@Param('id') id: string): Promise<ResponseCategoryDto> {
        return this.categoryService.getById(id);
    }
    
    @Get('slug/:slug')
    getCategoryBySlug(@Param('slug') slug: string): Promise<ResponseCategoryDto> {
        return this.categoryService.getBySlug(slug);
    }
    
    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<ResponseCategoryDto> {
        return this.categoryService.create(createCategoryDto);
    }

    @Roles('admin', 'employee')
    @UseGuards(JwtUserGuard, RolesGuard)
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<ResponseCategoryDto> {
        return this.categoryService.update(id, updateCategoryDto);
    }

    @Delete(':id')
    @Roles('admin')
    @UseGuards(JwtUserGuard, RolesGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    deleteCategory(@Param('id') id: string) {
        return this.categoryService.delete(id);
    }
}
