<div align="center">

[English](README.md) · **বাংলা**

# 🍚 মিল সিস্টেম — Website

মেসের মিল, বাজার আর টাকার হিসাবের ওয়েবসাইট। বাংলা আর English দুই ভাষায়, মোবাইল-ফার্স্ট।

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind CSS 4` · `SWR` · `Recharts`

API (backend) আলাদা রিপোতে থাকে।

</div>

---

## দ্রুত শুরু

```
npm install
copy .env.example .env.local      (Mac/Linux: cp .env.example .env.local)
npm run dev
```

খুলুন **http://localhost:3000**

backend লোকালে **http://localhost:4000**-এ চালু থাকতে হবে।

---

## Environment ভেরিয়েবল

| Key | লোকালে | অনলাইনে |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Render-এর ঠিকানা, যেমন `https://meal-system-backend.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | এই সাইটের Vercel ঠিকানা (SEO লিংকের জন্য) |

ঠিকানার শেষে `/` দেবেন না।

---

## Vercel-এ ডিপ্লয়

1. Vercel → **Add New → Project** → এই রিপো (Next.js নিজে চিনবে, Root Directory বদলাতে হবে না)
2. **Deploy-এর আগে** উপরের দুটো Environment Variable দিন
3. Deploy

পরে কোনো মান বদলালে **Deployments → ⋯ → Redeploy** করতে হয়।

শেষে backend-এর Render → Environment → `FRONTEND_URL`-এ এই সাইটের ঠিকানা বসান। না বসালে লগইন কাজ করবে না।

Google-এ আনতে Search Console-এ `https://আপনার-সাইট.vercel.app/sitemap.xml` জমা দিন।

---

## কমান্ড

| কমান্ড | কাজ |
|---|---|
| `npm run dev` | ডেভেলপমেন্ট সার্ভার |
| `npm run build` | production বিল্ড |
| `npm start` | বিল্ড করা সাইট চালু |
| `npm run typecheck` | TypeScript চেক |

---

## পেজ

| পেজ | কাজ |
|---|---|
| `/` | হোম পেজ |
| `/login`, `/register` | লগইন আর অ্যাকাউন্ট খোলা |
| `/onboarding` | মেস খোলা বা কোড দিয়ে জয়েন |
| `/join/[code]` | জয়েন লিংক |
| `/dashboard` | আমার ব্যালেন্স, মিল রেট, আজ কতজন খাবে, সবার হিসাব |
| `/meals` | প্রতিদিনের মিল আর গেস্ট, একসাথে অনেক দিন বদলানো |
| `/bazar`, `/deposits` | বাজার আর জমা, অ্যাপ্রুভাল, বাজারের পালা |
| `/costs` | বুয়া, গ্যাসের মতো অন্যান্য খরচ |
| `/members` | জয়েন কোড, রিকোয়েস্ট, অ্যাডমিন বানানো, বাদ দেওয়া |
| `/reports` | মাসের পুরো হিসাব, চার্ট, PDF/ছবি, মাস ক্লোজ, নতুন মাস |
| `/activity` | কে কী বদলেছে |
| `/settings` | মেস আর মাসের নিয়ম (অ্যাডমিন) |
| `/profile` | নাম, ফোন, পাসওয়ার্ড, ভাষা, থিম |

## গঠন

```
src/
├── app/
│   ├── (app)/          → লগইনের পরের সব পেজ
│   ├── layout.tsx      → SEO metadata, ফন্ট, থিম
│   ├── sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx
├── components/         → AppShell (মেনু), ui (বাটন/ফর্ম/মোডাল), EntriesPage ইত্যাদি
└── lib/
    ├── dict.ts         → বাংলা আর ইংরেজি সব লেখা — নতুন লেখা এখানে যোগ করুন
    ├── api.ts          → API কল, লগইন টোকেন, ধীর সার্ভারের সংকেত
    ├── i18n.tsx        → ভাষা আর সংখ্যা/তারিখ ফরম্যাট
    └── mess.tsx        → কোন মেস আর কোন মাস দেখা হচ্ছে
```
