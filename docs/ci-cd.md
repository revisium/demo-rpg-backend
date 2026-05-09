# CI/CD

## GitHub Actions Workflows

### CI (`ci.yml`)

Triggers: push to `master` / `release/**`, PRs to `master` / `release/**`

Steps:
1. Checkout (full history for SonarQube)
2. Setup Node 24.11.1
3. `npm ci --ignore-scripts --prefer-offline --no-audit --no-fund`
4. `npm run lint:ci` — ESLint with zero warnings
5. `npm run tsc` — TypeScript type check
6. Start test database (Docker Compose with health check wait)
7. Run migrations + seed
8. `npm run test:cov` — Jest with coverage
9. SonarQube scan (if `SONAR_TOKEN` is set)

### Build (`build.yml`)

Triggers: manual dispatch, push to `master`, tags `v*`

Steps:
1. Calls `revisium/revisium-actions/.github/workflows/docker-build.yml`
2. Builds `docker/Dockerfile`
3. Pushes Docker Hub image `${DOCKERHUB_USERNAME}/${repository-name}`

### Deploy (`deploy.yml`)

Triggers: manual dispatch, successful `Build` workflow on `master`

Calls `revisium/revisium-actions/.github/workflows/deploy.yml` and creates a GitHub deployment for the configured Kubernetes service.

### Release Train (`release-train.yml`)

Triggers: manual dispatch

Calls `revisium/revisium-actions/.github/workflows/release-train.yml` to create release branches and tags using the same release transitions as the core services. Use `dry_run=true` to validate the computed transition without pushing.

## Required Secrets

| Secret / Variable | Required | Description |
|---|---|---|
| `SONAR_TOKEN` | Optional | SonarQube/SonarCloud token |
| `SONAR_HOST_URL` | Optional (variable) | SonarQube/SonarCloud URL (GitHub variable, not secret) |
| `DOCKERHUB_USERNAME` | For build | Docker Hub username |
| `DOCKERHUB_TOKEN` | For build | Docker Hub access token |
| `KUBE_CONFIG` | For deploy | Kubernetes config used by the reusable deploy workflow |
| `KUBE_NAMESPACE` | For deploy (variable) | Kubernetes namespace |
| `KUBE_SERVICE_NAME` | For deploy (variable) | Kubernetes service/deployment name |
| `KUBE_APP_URL` | Optional deploy variable | Public application URL for deployment metadata |
| `RELEASE_BOT_CLIENT_ID` | For release train write mode (variable) | GitHub App client ID used by the reusable release workflow |
| `RELEASE_BOT_PRIVATE_KEY` | For release train write mode | GitHub App private key used to push release refs |

## Adding CI Steps

Edit `.github/workflows/ci.yml`. Common additions:
- E2E tests
- Database migration checks
- Security scanning (Snyk, Trivy)
