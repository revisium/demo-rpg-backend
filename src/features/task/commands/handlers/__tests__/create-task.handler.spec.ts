import { INestApplication } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { createHandlerModule } from 'src/__tests__/utils/create-handler-module';
import { CreateTaskHandler } from '../create-task.handler';
import { CreateTaskCommand } from '../../impl/create-task.command';

describe('CreateTaskHandler', () => {
  let app: INestApplication;
  let handler: CreateTaskHandler;
  let prisma: PrismaService;

  beforeAll(async () => {
    const result = await createHandlerModule([CreateTaskHandler]);
    app = result.app;
    handler = result.module.get(CreateTaskHandler);
    prisma = result.prisma;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a task and return its id', async () => {
    const id = nanoid();
    const user = await prisma.user.create({
      data: {
        email: `create-handler-${id}@test.com`,
        username: `create-handler-${id}`,
        password: 'hashed',
        roleId: 'admin',
      },
    });

    const result = await handler.execute(
      new CreateTaskCommand({
        title: `Handler Test ${id}`,
        description: 'Created by handler test',
        userId: user.id,
      }),
    );

    expect(result.id).toBeDefined();

    const task = await prisma.task.findUnique({ where: { id: result.id } });
    expect(task).not.toBeNull();
    expect(task!.title).toBe(`Handler Test ${id}`);
    expect(task!.userId).toBe(user.id);
  });
});
