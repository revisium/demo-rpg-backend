# After Fork Setup

> **Delete this file after completing all steps.**

## 1. Rename Project

Replace all occurrences of `template-nestjs-api` with your project name:

- `package.json` — `name`, `description`
- `src/api/mcp-api/mcp.controller.ts` — server `name` and `version`
- `src/api/rest-api/init-swagger.ts` — `setTitle()`, `setDescription()`, `setVersion()`
- `docker/docker-compose*.yml` — service and database names
- `sonar-project.properties` — `sonar.projectKey`, `sonar.organization`

## 2. Replace Example Domain

Rename `task` domain with your first domain:
- `src/features/task/` → `src/features/<your-domain>/`
- `src/api/graphql-api/task/` → `src/api/graphql-api/<your-domain>/`
- `src/api/rest-api/task/` → `src/api/rest-api/<your-domain>/`
- `src/api/mcp-api/tools/task.tools.ts` → your domain tools
- Update `src/app.module.ts` imports
- Update `prisma/schema.prisma` — replace `Task` model
- Update `src/features/auth/types.ts` — replace `PermissionSubject.Task`

## 3. Environment

```bash
cp .env.example .env
# Edit .env with your values (JWT_SECRET, ADMIN_PASSWORD, DATABASE_URL)
```

## 4. Database

```bash
docker compose -f docker/docker-compose.yml up -d
npm run prisma:generate
npm run prisma:migrate:dev -- --name init
npm run seed
```

## 5. Verify

```bash
npm run tsc          # No errors
npm run lint:ci      # No warnings
npm run start:dev    # Server starts
```

## 6. External Integrations

### Docker Hub (required for build workflow)

1. Create repository on [hub.docker.com](https://hub.docker.com)
2. Add secrets to GitHub repo settings:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN` ([create token](https://hub.docker.com/settings/security))
3. Update `.github/workflows/build.yml`:
   - Replace `your-registry/your-project` with your image name
   - Uncomment `branches: [master]` line to enable builds on push to master

### SonarCloud (recommended)

1. Sign in at [sonarcloud.io](https://sonarcloud.io) with GitHub
2. Import your repository
3. Copy project key and organization
4. Update `sonar-project.properties`:
   ```properties
   sonar.projectKey=your-org_your-project
   sonar.organization=your-org
   ```
5. Add to GitHub repo:
   - Secret: `SONAR_TOKEN`
   - Variable: `SONAR_HOST_URL` = `https://sonarcloud.io`

### GitHub Repository Settings

- Enable "Template repository" if you want others to fork this
- Set up branch protection for `master`:
  - Require status checks (CI)
  - Require pull request reviews

### Container Registry (alternative to Docker Hub)

If using GitHub Container Registry instead:
```yaml
# .github/workflows/build.yml
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

Image: `ghcr.io/<your-org>/<your-project>`

## 7. Cleanup

- Delete `docs/after-fork.md` (this file)
- Remove "Template Setup" section from `CLAUDE.md`
- Update `README.md` with your project info
