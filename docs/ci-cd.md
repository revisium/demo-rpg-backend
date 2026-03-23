# CI/CD

## GitHub Actions Workflows

### CI (`ci.yml`)

Triggers: push to `master`, PRs to `master`

Steps:
1. Checkout (full history for SonarQube)
2. Setup Node 24.11.1
3. `npm ci`
4. `npm run lint:ci` — ESLint with zero warnings
5. `npm run tsc` — TypeScript type check
6. Start test database (Docker)
7. Run migrations + seed
8. `npm run test:cov` — Jest with coverage
9. SonarQube scan (if `SONAR_TOKEN` is set)

### Build (`build.yml`)

Triggers: tags `v*` (branch trigger disabled by default — see `docs/after-fork.md`)

Steps:
1. Build Docker image
2. Push to Docker registry

### Bump Version (`bump-version.yml`)

Triggers: manual dispatch

Creates a commit with `npm version patch/minor/major` and pushes a tag.

## Required Secrets

| Secret / Variable | Required | Description |
|---|---|---|
| `SONAR_TOKEN` | Optional | SonarQube/SonarCloud token |
| `SONAR_HOST_URL` | Optional (variable) | SonarQube/SonarCloud URL (GitHub variable, not secret) |
| `DOCKERHUB_USERNAME` | For build | Docker Hub username |
| `DOCKERHUB_TOKEN` | For build | Docker Hub access token |

> The `bump-version` workflow pushes commits and tags. It requires a PAT (Personal Access Token) with `contents: write` permission if branch protection is enabled.

## Adding CI Steps

Edit `.github/workflows/ci.yml`. Common additions:
- E2E tests
- Database migration checks
- Security scanning (Snyk, Trivy)
