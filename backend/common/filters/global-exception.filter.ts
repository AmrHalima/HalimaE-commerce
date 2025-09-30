import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse, ErrorResponseDto } from '../dto/response.dto';
import { Prisma } from '@prisma/client';
import { LogService } from '../../src/logger/log.service';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly logger: LogService) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let httpStatus: number;
        let errorResponse: ErrorResponseDto;

        // Handle different types of exceptions
        if (exception instanceof HttpException) {
            httpStatus = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            
            if (typeof exceptionResponse === 'string') {
                errorResponse = {
                    message: exceptionResponse,
                };
            } else {
                errorResponse = {
                    message: (exceptionResponse as any).message || exception.message,
                    code: (exceptionResponse as any).code,
                };
            }
        } 
        // Handle Prisma errors
        else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            httpStatus = this.getPrismaErrorStatus(exception.code);
            errorResponse = {
                message: this.getPrismaErrorMessage(exception),
                code: exception.code,
            };
        }
        else if (exception instanceof Prisma.PrismaClientValidationError) {
            httpStatus = HttpStatus.BAD_REQUEST;
            errorResponse = {
                message: 'Invalid data provided',
                code: 'VALIDATION_ERROR',
            };
        }
        // Handle unexpected errors
        else {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
            errorResponse = {
                message: 'Internal server error',
            };

            // Log unexpected errors using your custom logger
            this.logger.error(
                `Unexpected error: ${exception}`,
                exception instanceof Error ? exception.stack : undefined,
                GlobalExceptionFilter.name,
            );
        }

        // Create the standardized error response
        const apiResponse = ApiResponse.error(errorResponse);
        apiResponse.statusCode = httpStatus;
        apiResponse.path = request.url;

        response.status(httpStatus).json(apiResponse);
    }

    private getPrismaErrorStatus(code: string): number {
        switch (code) {
            case 'P2002': // Unique constraint violation
                return HttpStatus.CONFLICT;
            case 'P2025': // Record not found
                return HttpStatus.NOT_FOUND;
            case 'P2003': // Foreign key constraint violation
                return HttpStatus.BAD_REQUEST;
            case 'P2014': // Invalid ID
                return HttpStatus.BAD_REQUEST;
            default:
                return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    private getPrismaErrorMessage(exception: Prisma.PrismaClientKnownRequestError): string {
        switch (exception.code) {
            case 'P2002':
                return `Duplicate entry. ${this.extractFieldFromMeta(exception.meta)} already exists.`;
            case 'P2025':
                return 'Record not found or you do not have permission to access it.';
            case 'P2003':
                return 'Invalid reference. Related record does not exist.';
            case 'P2014':
                return 'Invalid ID provided.';
            default:
                return 'Database operation failed.';
        }
    }

    private extractFieldFromMeta(meta: any): string {
        if (meta?.target) {
            if (Array.isArray(meta.target)) {
                return meta.target.join(', ');
            }
            return meta.target;
        }
        return 'Field';
    }
}