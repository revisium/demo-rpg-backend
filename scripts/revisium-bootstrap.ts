/* eslint-disable no-console, no-magic-numbers */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STANDALONE_URL = process.env.REVISIUM_STANDALONE_URL ?? 'http://localhost:8888';
const ADMIN_USERNAME = process.env.REVISIUM_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.REVISIUM_PASSWORD ?? 'admin';
const ORG = 'admin';
const PROJECT = 'demo-rpg-data';
const BRANCH = 'master';

async function login(): Promise<string> {
  const res = await fetch(`${STANDALONE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(
      `Login failed: ${res.status}. Is standalone running at ${STANDALONE_URL}? ` +
        `Start it with: npm run revisium:standalone`,
    );
  }
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

function applyMigrations(token: string) {
  console.log('→ Applying migrations from revisium/migrations.json…');
  const url = `revisium://${ADMIN_USERNAME}@${STANDALONE_URL.replace(/^https?:\/\//, '')}/${ORG}/${PROJECT}/${BRANCH}/draft?token=${token}`;
  const result = spawnSync(
    'npx',
    [
      'revisium',
      'migrate',
      'apply',
      '--file',
      './revisium/migrations.json',
      '--commit',
      '--create-project',
      '--url',
      url,
    ],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    throw new Error(`revisium migrate apply exited with code ${result.status}`);
  }
}

async function ensureRestEndpoint(token: string): Promise<void> {
  const headers = { Authorization: `Bearer ${token}` };
  const draft = (await (
    await fetch(
      `${STANDALONE_URL}/api/organization/${ORG}/projects/${PROJECT}/branches/${BRANCH}/draft-revision`,
      { headers },
    )
  ).json()) as { id: string };

  const existing = (await (
    await fetch(`${STANDALONE_URL}/api/revision/${draft.id}/endpoints`, { headers })
  ).json()) as Array<{ type: string; isDeleted: boolean }>;
  const hasRest = existing.some((e) => e.type === 'REST_API' && !e.isDeleted);
  if (hasRest) {
    console.log('→ REST_API endpoint already exists.');
    return;
  }

  console.log('→ Creating REST_API endpoint on draft…');
  const res = await fetch(`${STANDALONE_URL}/api/revision/${draft.id}/endpoints`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'REST_API' }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create REST endpoint: ${res.status} ${body}`);
  }
}

async function saveOpenApiSpec(token: string): Promise<void> {
  console.log('→ Fetching OpenAPI spec from standalone…');
  const url = `${STANDALONE_URL}/endpoint/openapi/${ORG}/${PROJECT}/${BRANCH}/draft/openapi.json`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Failed to fetch OpenAPI spec from ${url}: ${res.status}`);
  }
  const spec = (await res.json()) as Record<string, unknown>;
  const path = join(process.cwd(), 'revisium', 'openapi.json');
  writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
  console.log(`✓ Saved OpenAPI spec → ${path}`);
}

function runCodegen() {
  console.log('→ Running @hey-api/openapi-ts…');
  const result = spawnSync('npx', ['@hey-api/openapi-ts'], { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`openapi-ts codegen exited with code ${result.status}`);
  }
}

async function main() {
  console.log(`# Revisium bootstrap (standalone at ${STANDALONE_URL})`);
  const token = await login();
  applyMigrations(token);
  await ensureRestEndpoint(token);
  await saveOpenApiSpec(token);
  runCodegen();
  console.log('✓ Bootstrap complete. Generated client in src/__generated__/demo-rpg-data');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
