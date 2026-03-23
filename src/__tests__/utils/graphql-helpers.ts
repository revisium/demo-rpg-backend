import { INestApplication } from '@nestjs/common';
import request from 'supertest';

const GRAPHQL_URL = '/graphql';

interface GraphqlQueryOptions {
  app: INestApplication;
  query: string;
  variables?: Record<string, unknown>;
  token?: string;
}

interface GraphqlRawResponse<T = Record<string, unknown>> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

export async function gqlRawQuery<T = Record<string, unknown>>(
  options: GraphqlQueryOptions,
): Promise<GraphqlRawResponse<T>> {
  const req = request(options.app.getHttpServer()).post(GRAPHQL_URL);

  if (options.token) {
    req.set('Authorization', `Bearer ${options.token}`);
  }

  const res = await req.send({
    query: options.query,
    variables: options.variables,
  });

  return res.body as GraphqlRawResponse<T>;
}

export async function gqlQuery<T = Record<string, unknown>>(
  options: GraphqlQueryOptions,
): Promise<T> {
  const req = request(options.app.getHttpServer()).post(GRAPHQL_URL);

  if (options.token) {
    req.set('Authorization', `Bearer ${options.token}`);
  }

  const res = await req.send({
    query: options.query,
    variables: options.variables,
  });

  const body = res.body as { data?: T; errors?: Array<{ message: string }> };

  if (body.errors && body.errors.length > 0) {
    throw new Error(`GraphQL Error: ${body.errors[0]!.message}`);
  }

  return body.data as T;
}
