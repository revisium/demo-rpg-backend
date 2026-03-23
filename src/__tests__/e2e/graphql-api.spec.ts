import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  getTestApp,
  closeTestApp,
  prepareTask,
  PreparedTask,
  generateTestToken,
  gqlQuery,
  gqlRawQuery,
} from '../utils';

function extractCookies(res: request.Response): Record<string, string> {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const cookie of raw) {
    const [nameValue] = cookie.split(';');
    const eqIndex = nameValue!.indexOf('=');
    if (eqIndex > 0) {
      result[nameValue!.substring(0, eqIndex)] = nameValue!.substring(eqIndex + 1);
    }
  }
  return result;
}

describe('GraphQL API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixture: PreparedTask;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    prisma = app.get(PrismaService);
    fixture = await prepareTask(prisma);
    adminToken = generateTestToken(app, {
      userId: fixture.userId,
      email: fixture.userEmail,
      username: 'gql-e2e-admin',
      roleId: 'admin',
    });
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('Authorization', () => {
    it('should return error for unauthenticated query', async () => {
      const result = await gqlRawQuery({
        app,
        query: `query { tasks { items { id } totalCount } }`,
      });

      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should return error for invalid token', async () => {
      const result = await gqlRawQuery({
        app,
        token: 'invalid-token',
        query: `query { tasks { items { id } totalCount } }`,
      });

      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('JWT Lifecycle (cookies via GraphQL)', () => {
    it('login mutation should set cookies and return expiresIn', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation Login($data: LoginInput!) { login(data: $data) { expiresIn tokenType } }`,
          variables: { data: { email: fixture.userEmail, password: fixture.userPassword } },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.login.expiresIn).toBeDefined();
      expect(res.body.data.login.tokenType).toBe('cookie');

      const cookies = extractCookies(res);
      expect(cookies['rev_at']).toBeDefined();
      expect(cookies['rev_rt']).toBeDefined();
    });

    it('me query should work with cookie from login', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation Login($data: LoginInput!) { login(data: $data) { expiresIn tokenType } }`,
          variables: { data: { email: fixture.userEmail, password: fixture.userPassword } },
        });

      const cookies = extractCookies(loginRes);

      const meRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `rev_at=${cookies['rev_at']}`)
        .send({ query: `query { me { id email } }` });

      expect(meRes.body.data.me.id).toBe(fixture.userId);
    });

    it('refreshToken mutation should rotate tokens', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation Login($data: LoginInput!) { login(data: $data) { expiresIn tokenType } }`,
          variables: { data: { email: fixture.userEmail, password: fixture.userPassword } },
        });

      const loginCookies = extractCookies(loginRes);

      const refreshRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `rev_rt=${loginCookies['rev_rt']}`)
        .send({ query: `mutation { refreshToken { expiresIn tokenType } }` });

      expect(refreshRes.body.data.refreshToken.expiresIn).toBeDefined();

      const refreshCookies = extractCookies(refreshRes);
      expect(refreshCookies['rev_at']).toBeDefined();
      expect(refreshCookies['rev_rt']).toBeDefined();
      expect(refreshCookies['rev_rt']).not.toBe(loginCookies['rev_rt']);
    });

    it('refreshToken without cookie should return error', async () => {
      const result = await gqlRawQuery({
        app,
        query: `mutation { refreshToken { expiresIn tokenType } }`,
      });

      expect(result.errors).toBeDefined();
    });

    it('logout mutation should return true', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation Login($data: LoginInput!) { login(data: $data) { expiresIn tokenType } }`,
          variables: { data: { email: fixture.userEmail, password: fixture.userPassword } },
        });

      const cookies = extractCookies(loginRes);

      const logoutRes = await request(app.getHttpServer())
        .post('/graphql')
        .set('Cookie', `rev_at=${cookies['rev_at']}; rev_rt=${cookies['rev_rt']}`)
        .send({ query: `mutation { logout }` });

      expect(logoutRes.body.data.logout).toBe(true);
    });

    it('me should work with Bearer header (backwards compatible)', async () => {
      const result = await gqlQuery<{ me: { id: string } }>({
        app,
        token: adminToken,
        query: `query { me { id email } }`,
      });

      expect(result.me.id).toBe(fixture.userId);
    });
  });

  describe('Query: task', () => {
    it('should return a task by id', async () => {
      const result = await gqlQuery<{ task: { id: string; title: string } }>({
        app,
        token: adminToken,
        query: `
          query GetTask($taskId: String!) {
            task(taskId: $taskId) {
              id
              title
              description
              status
            }
          }
        `,
        variables: { taskId: fixture.taskId },
      });

      expect(result.task.id).toBe(fixture.taskId);
      expect(result.task.title).toBe(fixture.taskTitle);
    });
  });

  describe('Query: tasks', () => {
    it('should return tasks list', async () => {
      const result = await gqlQuery<{
        tasks: { items: Array<{ id: string }>; totalCount: number };
      }>({
        app,
        token: adminToken,
        query: `
          query GetTasks {
            tasks {
              items { id title status }
              totalCount
            }
          }
        `,
      });

      expect(result.tasks.items.length).toBeGreaterThanOrEqual(1);
      expect(result.tasks.totalCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Mutation: createTask', () => {
    it('should create a new task', async () => {
      const result = await gqlQuery<{ createTask: { id: string } }>({
        app,
        token: adminToken,
        query: `
          mutation CreateTask($data: CreateTaskInput!) {
            createTask(data: $data) { id }
          }
        `,
        variables: { data: { title: 'GraphQL E2E Task' } },
      });

      expect(result.createTask.id).toBeDefined();
    });
  });

  describe('Mutation: updateTask', () => {
    it('should update a task', async () => {
      const result = await gqlQuery<{ updateTask: { id: string } }>({
        app,
        token: adminToken,
        query: `
          mutation UpdateTask($data: UpdateTaskInput!) {
            updateTask(data: $data) { id }
          }
        `,
        variables: { data: { taskId: fixture.taskId, title: 'Updated via GraphQL' } },
      });

      expect(result.updateTask.id).toBe(fixture.taskId);
    });
  });

  describe('Mutation: deleteTask', () => {
    it('should delete a task', async () => {
      const created = await gqlQuery<{ createTask: { id: string } }>({
        app,
        token: adminToken,
        query: `mutation CreateTask($data: CreateTaskInput!) { createTask(data: $data) { id } }`,
        variables: { data: { title: 'To Be Deleted GQL' } },
      });

      const result = await gqlQuery<{ deleteTask: { success: boolean } }>({
        app,
        token: adminToken,
        query: `mutation DeleteTask($taskId: String!) { deleteTask(taskId: $taskId) { success } }`,
        variables: { taskId: created.createTask.id },
      });

      expect(result.deleteTask.success).toBe(true);
    });
  });
});
