# SonarQube

## SonarCloud (Recommended for Open Source)

1. Go to [sonarcloud.io](https://sonarcloud.io) and sign in with GitHub
2. Import your repository
3. Get project key and organization
4. Update `sonar-project.properties`:
   ```properties
   sonar.projectKey=your-org_your-project
   sonar.organization=your-org
   ```
5. Add `SONAR_TOKEN` to GitHub repository secrets
6. Add `SONAR_HOST_URL=https://sonarcloud.io` to GitHub repository variables

## Local SonarQube

```bash
# Start SonarQube
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Open http://localhost:9000 (admin/admin)
# Create project, get token

# Run scan
npx sonarqube-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<your-token>
```

## Configuration

`sonar-project.properties` is organized by sections:

| Section | What It Controls |
|---|---|
| **Base Configuration** | `sonar.projectKey`, `sonar.organization` — update after fork |
| **Coverage Settings** | LCOV report path |
| **Standard Exclusions** | Files excluded from analysis and coverage |
| **Issue Ignore Rules** | CQRS boilerplate (S6564, S2094) |
| **Technical Debt** | Suppressions with `TODO:` comments for planned fixes |
| **False Positives** | Test passwords, docker-compose credentials |
| **Duplicate Code** | MCP tools, test files, generated code |

### Suppression Naming Convention

| Prefix | Category | Example |
|---|---|---|
| `e1-eN` | **CQRS/Architecture** — structural patterns | S6564 on `*.command.ts` |
| `tech1-techN` | **Technical Debt** — with `TODO:` comment | S107 too many params |
| `fp1-fpN` | **False Positives** — sonar is wrong | S2068 on test docker-compose |

### When to Update

- **Adding generated code** → add to `sonar.exclusions`
- **Adding CQRS patterns** (events, etc.) → add `e5`, `e6` suppressions for S6564/S2094
- **Adding test utilities** → add to `sonar.cpd.exclusions`
- **Adding infra files** (modules, index barrels) → add to `sonar.coverage.exclusions`
- **New false positive from sonar** → add `fp` with comment explaining why it's wrong
- **Tech debt you can't fix now** → add `tech` with `TODO:` comment explaining the plan
- **New suppressions** must also be added to the `sonar.issue.ignore.multicriteria=` comma-separated list at the top of the section

## Quality Gates

Recommended quality gate settings:
- Coverage on new code: > 80%
- Duplicated lines on new code: < 3%
- Maintainability rating: A
- Reliability rating: A
- Security rating: A
