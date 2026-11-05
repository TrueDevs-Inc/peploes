# Peploe's

The Next.js website for [Peploe's](https://peploes.com/), a family-run restaurant
on St Stephen's Green, Dublin. See the [product brief](docs/project/brief.md)
for brand, content and visitor requirements.

## Development

Use the Bun version declared in [`package.json`](package.json).

```bash
bun install --frozen-lockfile
test -f .env.local || cp .env.example .env.local
bun run dev
```

Set the required values in `.env.local` before starting the application.
Use `http://localhost:3000` for local public URLs and a disposable PostgreSQL
database for `DATABASE_URL`. Optional integration values can remain empty.

The inherited example API requires the existing database migrations. Verify the
database target before running `bun run db:migrate`. Protected example mutations
remain disabled until a verified session is implemented.

## Verification

Follow the [verification skill](.agents/skills/verification/SKILL.md#local-verification)
for checks appropriate to the change. Database integration tests require a migrated
disposable database. The GitHub workflow provisions its own database for that check.

## Documentation

| Document | Owns |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Module placement, dependency direction, and source conventions |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branch, commit, review, and contribution workflow |
| [`AGENTS.md`](AGENTS.md) | Agent authorization and repository-specific operating rules |
| [verification skill](.agents/skills/verification/SKILL.md) | Verification, CI, hooks and review |
| [html-reports skill](.agents/skills/html-reports/SKILL.md) | Standalone HTML reports |
| [project-adoption skill](.agents/skills/project-adoption/SKILL.md) | Replacing inherited template defaults |
| [test-quality skill](.agents/skills/test-quality/SKILL.md) | Test selection and test-suite policy |
| [`.agents/skills/`](.agents/skills) | Error handling, logging, analytics, Sentry, performance, and SEO |
