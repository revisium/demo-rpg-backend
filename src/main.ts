import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './infrastructure/filters/global-exception.filter';
import { initSwagger } from './api/rest-api/init-swagger';

const DEFAULT_PORT = 8080;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors();

  initSwagger(app);

  const port = process.env['PORT'] || DEFAULT_PORT;
  await app.listen(port);
}

bootstrap();
