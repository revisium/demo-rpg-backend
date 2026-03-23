import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';

let cachedApp: INestApplication | null = null;

export async function getTestApp(): Promise<INestApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  cachedApp = moduleFixture.createNestApplication();
  cachedApp.use(cookieParser());
  cachedApp.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await cachedApp.init();

  return cachedApp;
}

export async function closeTestApp(): Promise<void> {
  if (cachedApp) {
    await cachedApp.close();
    cachedApp = null;
  }
}
