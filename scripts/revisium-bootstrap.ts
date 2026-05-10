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

function buildUrl(token: string, revision: 'draft' | 'head' | null): string {
  const { host } = new URL(STANDALONE_URL);
  const target = revision === null ? BRANCH : `${BRANCH}:${revision}`;
  return `revisium://${ADMIN_USERNAME}@${host}/${ORG}/${PROJECT}/${target}?token=${token}`;
}

async function login(): Promise<string> {
  try {
    const res = await fetch(`${STANDALONE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { accessToken: string };
    return body.accessToken;
  } catch (err) {
    throw new Error(
      `Login failed at ${STANDALONE_URL}. Is standalone running? ` +
        `Start it with: npm run revisium:standalone\n  cause: ${err instanceof Error ? err.message : err}`,
    );
  }
}

function runCli(args: string[], step: string): void {
  console.log(`→ ${step}`);
  const result = spawnSync('npx', args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${step} failed: npx ${args.join(' ')} exited with code ${result.status}`);
  }
}

async function saveOpenApiSpec(token: string): Promise<void> {
  console.log('→ Fetching OpenAPI spec from /master/head…');
  const url = `${STANDALONE_URL}/endpoint/openapi/${ORG}/${PROJECT}/${BRANCH}/head/openapi.json`;
  const headers = { Authorization: `Bearer ${token}` };
  // Endpoint registration can take a moment to propagate after creation.
  const maxAttempts = 5;
  let lastStatus = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const spec = (await res.json()) as Record<string, unknown>;
      const path = join(process.cwd(), 'revisium', 'openapi.json');
      writeFileSync(path, JSON.stringify(spec, null, 2) + '\n');
      console.log(`✓ Saved OpenAPI spec → ${path}`);
      return;
    }
    lastStatus = res.status;
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  throw new Error(`Failed to fetch OpenAPI spec after ${maxAttempts} attempts: HTTP ${lastStatus}`);
}

async function main() {
  console.log(`# Revisium bootstrap (standalone at ${STANDALONE_URL})`);
  const token = await login();

  // 1. Ensure project + branch exist (idempotent).
  runCli(
    ['revisium', 'project', 'ensure', '--url', buildUrl(token, null)],
    'revisium project ensure',
  );

  // 2. Apply migrations on draft and commit to head.
  runCli(
    [
      'revisium',
      'migrate',
      'apply',
      '--file',
      './revisium/migrations.json',
      '--commit',
      '--url',
      buildUrl(token, 'draft'),
    ],
    'revisium migrate apply',
  );

  // 3. Ensure REST endpoint on head (idempotent — endpoints attach directly to head).
  runCli(
    [
      'revisium',
      'endpoint',
      'ensure',
      '--type',
      'REST_API',
      '--url',
      buildUrl(token, 'head'),
    ],
    'revisium endpoint ensure',
  );

  // 4. Capture spec + regenerate the typed client.
  await saveOpenApiSpec(token);
  runCli(['@hey-api/openapi-ts'], '@hey-api/openapi-ts');

  console.log('✓ Bootstrap complete. Generated client in src/__generated__/demo-rpg-data');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
