import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.disable('x-powered-by');

//   app.useLogger(app.get('LogService'));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public/',
  });
  
  app.setGlobalPrefix('/api');
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
