<div align="center">

**English** · [বাংলা](README.bn.md)

# 🍚 Meal System — Website

Website for tracking meals, bazar (groceries) and money in shared messes. Bangla and English, mobile-first.

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind CSS 4` · `SWR` · `Recharts`

The API (backend) lives in a separate repo.

</div>

---

## Quick start

```
npm install
copy .env.example .env.local      (Mac/Linux: cp .env.example .env.local)
npm run dev
```

Open **http://localhost:3000**

The backend must be running locally on **http://localhost:4000**.

---

## Environment variables

| Key | Local | Production |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Your Render URL, e.g. `https://meal-system-backend.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | This site's Vercel URL (used for SEO links) |

No trailing `/`.

---

## Deploying to Vercel

1. Vercel → **Add New → Project** → this repo (Next.js is detected; no need to change Root Directory)
2. **Before deploying**, add the two environment variables above
3. Deploy

If you change a value later, use **Deployments → ⋯ → Redeploy**.

Finally, in the backend's Render → Environment, set `FRONTEND_URL` to this site's address. Without it, login won't work.

To get on Google, submit `https://your-site.vercel.app/sitemap.xml` in Search Console.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Start the built site |
| `npm run typecheck` | TypeScript check |

---

## Pages

| Page | Purpose |
|---|---|
| `/` | Home page |
| `/login`, `/register` | Log in and sign up |
| `/onboarding` | Open a mess or join with a code |
| `/join/[code]` | Join link |
| `/dashboard` | My balance, meal rate, today's headcount, everyone's balances |
| `/meals` | Daily meals and guests, change many days at once |
| `/bazar`, `/deposits` | Bazar and deposits, approvals, bazar duty |
| `/costs` | Other costs like maid and gas |
| `/members` | Join code, requests, make admin, remove |
| `/reports` | Full monthly account, charts, PDF/image, close month, new month |
| `/activity` | Who changed what |
| `/settings` | Mess and month rules (admin) |
| `/profile` | Name, phone, password, language, theme |

## Structure

```
src/
├── app/
│   ├── (app)/          → every page after login
│   ├── layout.tsx      → SEO metadata, fonts, theme
│   ├── sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx
├── components/         → AppShell (menus), ui (buttons/forms/modals), EntriesPage, etc.
└── lib/
    ├── dict.ts         → every Bangla and English string — add new text here
    ├── api.ts          → API calls, login token, slow-server signal
    ├── i18n.tsx        → language and number/date formatting
    └── mess.tsx        → which mess and month is being viewed
```
