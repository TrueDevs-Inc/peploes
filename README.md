# Peploe's

The Next.js website for [Peploe's](https://peploes.com/), a family-run restaurant
on St Stephen's Green, Dublin. See the [product brief](docs/project/brief.md)
for brand, content and visitor requirements.

## Development

Use the Bun version declared in [`package.json`](package.json).

```bash
bun install --frozen-lockfile
test -f .env || cp .env.example .env
bun run dev
```

Set the required values in `.env` before starting the application.
Use `http://localhost:3000` for local public URLs and a disposable PostgreSQL
database for `DATABASE_URL`. Optional integration values can remain empty.

Database integration checks require a migrated disposable database. Verify its
target and obtain explicit permission before running migrations locally.

## Verification

Choose local checks for the changed behavior using the
[quality guide](docs/guides/quality-guide.md#required-checks). Ordinary CSS and
prose edits do not require a test run. Shared CI runs the full integration gate.
Database integration checks require an explicitly approved disposable database.

## Documentation

| Document | Owns |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Module placement, dependency direction, and source conventions |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branch, commit, review, and contribution workflow |
| [`AGENTS.md`](AGENTS.md) | Agent authorization and repository-specific operating rules |
| [`docs/guides/quality-guide.md`](docs/guides/quality-guide.md) | Verification, CI, hooks and review |
| [`docs/guides/project-adoption-guide.md`](docs/guides/project-adoption-guide.md) | Replacing inherited template defaults |
| [`docs/guides/testing-guide.md`](docs/guides/testing-guide.md) | Test selection and test-suite policy |
| [`docs/guides/`](docs/guides) | Error handling, logging, analytics, Sentry, performance, and SEO |
