import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

interface HandlerModuleResult {
  app: INestApplication;
  module: TestingModule;
  prisma: PrismaService;
}

export async function createHandlerModule(providers: any[]): Promise<HandlerModuleResult> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [DatabaseModule, CqrsModule],
    providers,
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  const prisma = module.get(PrismaService);

  return { app, module, prisma };
}
