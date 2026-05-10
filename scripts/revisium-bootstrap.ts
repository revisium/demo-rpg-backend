/* eslint-disable no-console, no-magic-numbers */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STANDALONE_URL = process.env.REVISIUM_STANDALONE_URL ?? 'http://localhost:8888';
const ADMIN_USERNAME = process.env.REVISIUM_USERNAME ?? 'admin';
const ADMIN_PASSWORD =
  process.env.REVISIUM_PASSWORD ?? process.env.ADMIN_PASSWORD ?? 'admin';
const ORG = 'admin';
const PROJECT = 'demo-rpg-data';
const BRANCH = 'master';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${init?.method ?? 'GET'} ${url} → ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function login(): Promise<string> {
  try {
    const body = await fetchJson<{ accessToken: string }>(`${STANDALONE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    });
    return body.accessToken;
  } catch (err) {
    throw new Error(
      `Login failed at ${STANDALONE_URL}. Is standalone running? ` +
        `Start it with: npm run revisium:standalone\n  cause: ${err instanceof Error ? err.message : err}`,
    );
  }
}

function applyMigrations(token: string) {
  console.log('→ Applying migrations from revisium/migrations.json…');
  const { host } = new URL(STANDALONE_URL);
  const url = `revisium://${ADMIN_USERNAME}@${host}/${ORG}/${PROJECT}/${BRANCH}/draft?token=${token}`;
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

async function ensureRestEndpoint(token: string): Promise<boolean> {
  const headers = { Authorization: `Bearer ${token}` };
  const draft = await fetchJson<{ id: string }>(
    `${STANDALONE_URL}/api/organization/${ORG}/projects/${PROJECT}/branches/${BRANCH}/draft-revision`,
    { headers },
  );

  const existing = await fetchJson<Array<{ type: string; isDeleted: boolean }>>(
    `${STANDALONE_URL}/api/revision/${draft.id}/endpoints`,
    { headers },
  );
  if (existing.some((e) => e.type === 'REST_API' && !e.isDeleted)) {
    console.log('→ REST_API endpoint already exists.');
    return false;
  }

  console.log('→ Creating REST_API endpoint on draft…');
  await fetchJson(`${STANDALONE_URL}/api/revision/${draft.id}/endpoints`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'REST_API' }),
  });
  return true;
}

async function commitDraft(token: string, comment: string): Promise<void> {
  console.log(`→ Publishing draft → head (${comment})…`);
  await fetchJson(
    `${STANDALONE_URL}/api/organization/${ORG}/projects/${PROJECT}/branches/${BRANCH}/create-revision`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    },
  );
}

async function saveOpenApiSpec(token: string): Promise<void> {
  console.log('→ Fetching OpenAPI spec from /master/head…');
  const url = `${STANDALONE_URL}/endpoint/openapi/${ORG}/${PROJECT}/${BRANCH}/head/openapi.json`;
  const spec = await fetchJson<Record<string, unknown>>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
  const created = await ensureRestEndpoint(token);
  if (created) {
    await commitDraft(token, 'bootstrap: publish REST endpoint');
  }
  await saveOpenApiSpec(token);
  runCodegen();
  console.log('✓ Bootstrap complete. Generated client in src/__generated__/demo-rpg-data');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
