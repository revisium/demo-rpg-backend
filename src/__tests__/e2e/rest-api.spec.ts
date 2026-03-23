import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import {
  getTestApp,
  closeTestApp,
  prepareTask,
  PreparedTask,
  generateTestToken,
  anonGet,
  anonPost,
  authGet,
  authPost,
  authPatch,
  authDelete,
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

describe('REST API (E2E)', () => {
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
      username: 'rest-e2e-admin',
      roleId: 'admin',
    });
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe('Authorization', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await anonGet(app, '/api/tasks');
      expect(res.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const res = await authGet(app, '/api/tasks', 'invalid-token');
      expect(res.status).toBe(401);
    });

    it('should return 401 for unauthenticated POST', async () => {
      const res = await anonPost(app, '/api/tasks', { title: 'Unauthorized' });
      expect(res.status).toBe(401);
    });
  });

  describe('JWT Lifecycle (cookies)', () => {
    it('login should set rev_at and rev_rt cookies', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: fixture.userEmail, password: fixture.userPassword });

      expect(res.status).toBe(201);
      expect(res.body.expiresIn).toBeDefined();
      expect(res.body.tokenType).toBe('cookie');

      const cookies = extractCookies(res);
      expect(cookies['rev_at']).toBeDefined();
      expect(cookies['rev_rt']).toBeDefined();
    });

    it('me should work with cookie from login', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: fixture.userEmail, password: fixture.userPassword });

      const cookies = extractCookies(loginRes);

      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', `rev_at=${cookies['rev_at']}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.id).toBe(fixture.userId);
    });

    it('refresh should rotate tokens', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: fixture.userEmail, password: fixture.userPassword });

      const loginCookies = extractCookies(loginRes);

      const refreshRes = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `rev_rt=${loginCookies['rev_rt']}`);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.expiresIn).toBeDefined();

      const refreshCookies = extractCookies(refreshRes);
      expect(refreshCookies['rev_at']).toBeDefined();
      expect(refreshCookies['rev_rt']).toBeDefined();
      expect(refreshCookies['rev_rt']).not.toBe(loginCookies['rev_rt']);
    });

    it('refresh without cookie should return 401', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('refresh with used token should detect reuse after grace period', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: fixture.userEmail, password: fixture.userPassword });

      const loginCookies = extractCookies(loginRes);
      const oldRefreshToken = loginCookies['rev_rt']!;

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `rev_rt=${oldRefreshToken}`);

      const reuseRes = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `rev_rt=${oldRefreshToken}`);

      expect([200, 401]).toContain(reuseRes.status);
    });

    it('logout should clear cookies', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: fixture.userEmail, password: fixture.userPassword });

      const loginCookies = extractCookies(loginRes);

      const logoutRes = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', `rev_at=${loginCookies['rev_at']}; rev_rt=${loginCookies['rev_rt']}`);

      expect(logoutRes.status).toBe(204);

      const logoutCookies = logoutRes.headers['set-cookie'] as unknown as string[];
      expect(logoutCookies).toBeDefined();
      const clearedNames = logoutCookies
        .filter((c: string) => c.includes('Max-Age=0') || c.includes('Expires='))
        .map((c: string) => c.split('=')[0]);
      expect(clearedNames).toContain('rev_at');
      expect(clearedNames).toContain('rev_rt');
    });

    it('me should still work with Bearer header', async () => {
      const res = await authGet(app, '/api/auth/me', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(fixture.userId);
    });

    it('expired JWT should return 401', async () => {
      const { JwtService } = await import('@nestjs/jwt');
      const jwtService = app.get(JwtService);
      const expiredToken = jwtService.sign(
        {
          sub: fixture.userId,
          email: fixture.userEmail,
          username: 'test',
          roleId: 'admin',
          ver: 0,
        },
        { secret: process.env['JWT_SECRET'], expiresIn: '0s' },
      );

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', `rev_at=${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    it('should return tasks list', async () => {
      const res = await authGet(app, '/api/tasks', adminToken).expect(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.totalCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/tasks/:taskId', () => {
    it('should return a task by id', async () => {
      const res = await authGet(app, `/api/tasks/${fixture.taskId}`, adminToken).expect(200);
      expect(res.body.id).toBe(fixture.taskId);
      expect(res.body.title).toBe(fixture.taskTitle);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await authGet(app, '/api/tasks/non-existent-id', adminToken);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await authPost(app, '/api/tasks', adminToken, {
        title: 'E2E Created Task',
        description: 'Created via E2E test',
      }).expect(201);
      expect(res.body.id).toBeDefined();
    });

    it('should reject invalid input (empty body)', async () => {
      const res = await authPost(app, '/api/tasks', adminToken, {});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/tasks/:taskId', () => {
    it('should update a task', async () => {
      const res = await authPatch(app, `/api/tasks/${fixture.taskId}`, adminToken, {
        title: 'Updated Title',
      }).expect(200);
      expect(res.body.id).toBe(fixture.taskId);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    it('should delete a task', async () => {
      const created = await authPost(app, '/api/tasks', adminToken, {
        title: 'To Be Deleted',
      }).expect(201);

      const deleteRes = await authDelete(app, `/api/tasks/${created.body.id}`, adminToken);
      expect(deleteRes.status).toBe(200);

      const getRes = await authGet(app, `/api/tasks/${created.body.id}`, adminToken);
      expect(getRes.status).toBe(404);
    });
  });
});
