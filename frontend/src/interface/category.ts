export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    parent: Category | null;
}

export interface CategoriesResponse {
    success: boolean;
    data: {
        categories: Category[];
        meta: {
            totalCategories: number;
            totalPages: number;
            currentPage: number;
        };
    };
    error: null;
    message: string;
    statusCode: number;
    timestamp: string;
}
