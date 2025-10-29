# Repository Guidelines

## Project Structure & Module Organization
- App Router code lives in `app/`; keep the landing view in `page.tsx`, global metadata in `layout.tsx`, and Tailwind layers in `globals.css`.
- Use `components/` for shared UI (PascalCase filenames), `lib/` for server/client helpers, and `types/` for reusable interfaces.
- Retain `CS-Construction-System-Architecture.md` and `cdhi_supabase_schema.sql` as the source of truth for integrations and schema decisions.

## Build, Test, and Development Commands
- `npm run dev` starts the local Next.js server with hot reload on `http://localhost:3000`.
- `npm run build` creates the production bundle and fails on unresolved lint/type errors.
- `npm run start` serves the optimized build; rely on it for Docker or Vercel smoke tests.
- `npm run lint` runs the Next.js ESLint stack.
- `npm run type-check` executes `tsc --noEmit` against the strict config.

## Coding Style & Naming Conventions
- Follow Prettier defaults (2 spaces, semicolons) and keep Tailwind utilities grouped `layout → spacing → color`.
- Use PascalCase for React components, camelCase for utilities, and SCREAMING_SNAKE_CASE for constants.
- Prefer the `@/` alias from `tsconfig.json` and centralize metadata/fonts in `app/layout.tsx`.

## Testing Guidelines
- A formal harness is pending; add React Testing Library or Playwright suites under `__tests__/` or `app/(tests)/` as features land.
- Until tests exist, document manual checks in pull requests and gate merges on `npm run lint` and `npm run type-check`.
- Prioritize coverage for lead intake, Supabase helpers, and future Invoice Ninja integrations.

## Commit & Pull Request Guidelines
- Use imperative, Conventional Commit-style subjects (`feat:`, `fix:`, `chore:`) under 72 characters; add short body bullets when context is needed.
- Reference related issues or sections of the architecture doc when touching integrations or schema.
- Pull requests must include: change summary, verification notes, rollout considerations, and new env vars or migrations.

## Security & Configuration Notes
- Keep environment secrets in `.env.local` (gitignored) and document required keys for Supabase, Stripe, Postmark, and Twilio before enabling those flows.
- Consult the architecture guide before altering network topology or third-party services; surface compliance implications early.
- Never commit production credentials—rotate Supabase, Invoice Ninja, and Stripe tokens through the agreed secrets manager.
