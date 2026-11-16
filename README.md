# MarketingOS

An internal marketing operations platform: one place for a small marketing team to run
campaigns from objective to shipped deliverable, with manager review built into the flow.

## What it does

- **Campaigns → Projects → Tasks → Deliverables** — a campaign carries an objective,
  business goal, audience and channels; projects move through stages; tasks have
  priorities, dependencies and statuses; deliverables are typed and reviewable.
- **Review workflow** — managers approve, request changes or reject deliverables;
  every action is logged (ReviewAction + ActivityLog), so the audit trail is free.
- **Role-based access** — `MANAGER` / `MEMBER` roles via NextAuth (Google OAuth),
  with a dev-only credentials bypass for local testing.
- **Operating views** — dashboard, CEO dashboard, content calendar, analytics,
  asset library, SOP library, and channel workspaces (email, newsletter, LinkedIn,
  SEO, website).
- **Exports** — spreadsheet export via ExcelJS.

## Stack

Next.js (App Router) · TypeScript · Prisma + PostgreSQL · NextAuth · Tailwind CSS · ExcelJS

## Run it

```bash
cp .env.template .env   # fill in DATABASE_URL, NextAuth + Google OAuth values
npm install
npx prisma migrate dev
npx prisma db seed       # fictional demo team + campaign
npm run dev
```

Seed data is entirely fictional (example.com users, invented campaigns).
