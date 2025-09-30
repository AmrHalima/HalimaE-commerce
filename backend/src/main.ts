import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { LogService } from './logger/log.service';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.disable('x-powered-by');

  const logService = app.get<LogService>(LogService);
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
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
