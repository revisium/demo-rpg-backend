import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export function anonGet(app: INestApplication, url: string): request.Test {
  return request(app.getHttpServer()).get(url);
}

export function anonPost(app: INestApplication, url: string, body?: object): request.Test {
  const req = request(app.getHttpServer()).post(url);
  if (body) req.send(body);
  return req;
}

export function authGet(app: INestApplication, url: string, token: string): request.Test {
  return request(app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`);
}

export function authPost(
  app: INestApplication,
  url: string,
  token: string,
  body?: object,
): request.Test {
  const req = request(app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`);
  if (body) req.send(body);
  return req;
}

export function authPatch(
  app: INestApplication,
  url: string,
  token: string,
  body?: object,
): request.Test {
  const req = request(app.getHttpServer()).patch(url).set('Authorization', `Bearer ${token}`);
  if (body) req.send(body);
  return req;
}

export function authDelete(app: INestApplication, url: string, token: string): request.Test {
  return request(app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`);
}
