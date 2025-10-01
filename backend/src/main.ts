import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import helmet from 'helmet';
import { LogService } from './logger/log.service';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:3001',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 3600,
  });

  app.disable('x-powered-by');

  const logService = app.get<LoggerService>(LogService);
  app.useLogger(logService);
  
  // Global exception filter for standardized error responses
  app.useGlobalFilters(new GlobalExceptionFilter(logService));
  
  // Global response interceptor for standardized success responses
  const reflector = app.get<Reflector>(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  
  app.useStaticAssets(join(__dirname, '..', 'public', 'uploads'), {
        prefix: '/images/',
  });
  
  app.setGlobalPrefix('/api');
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Halima E-commerce API')
    .setDescription('Professional e-commerce API documentation for Halima E-commerce platform')
    .setVersion('1.0')
    .addTag('categories', 'Category management endpoints')
    .addTag('products', 'Product management endpoints')
    .addTag('cart', 'Shopping cart endpoints')
    .addTag('customers', 'Customer management endpoints')
    .addTag('users', 'User management endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
  
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
