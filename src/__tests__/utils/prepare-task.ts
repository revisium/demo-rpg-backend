import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

const SALT_ROUNDS = 10;
const TEST_PASSWORD = 'test-password-123';

export interface PreparedTask {
  userId: string;
  userEmail: string;
  userPassword: string;
  taskId: string;
  taskTitle: string;
}

export async function prepareTask(prisma: PrismaService): Promise<PreparedTask> {
  const id = nanoid();
  const userEmail = `test-${id}@example.com`;
  const username = `user-${id}`;
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: userEmail,
      username,
      password: hashedPassword,
      roleId: 'admin',
    },
  });

  const task = await prisma.task.create({
    data: {
      title: `Test Task ${id}`,
      description: `Description for task ${id}`,
      userId: user.id,
    },
  });

  return {
    userId: user.id,
    userEmail,
    userPassword: TEST_PASSWORD,
    taskId: task.id,
    taskTitle: task.title,
  };
}
