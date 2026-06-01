# Memorial Website

A password-protected memorial website built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## Features

- 🔒 **Password protection** — HMAC-signed session cookies with SHA-256 password hashing
- 📖 **Timeline** — Life story with chronological milestones
- 📷 **Photo gallery** — Masonry-style layout with captions
- ✍️ **Memorial articles** — Markdown-based articles with font-size controls
- 🛡️ **Security headers** — CSP, X-Frame-Options, nosniff, noindex for private pages

## Tech Stack

- [Astro](https://astro.build) 5.x
- [Cloudflare Pages](https://pages.cloudflare.com) (server-side rendering)
- [Cloudflare R2](https://r2.cloudflare.com) (photo storage)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd memory-website
npm install
```

### 2. Run Locally (Default Password)

The project works out of the box with a default password:

| Field | Value |
|---|---|
| Password | `123456` |

```bash
npm run dev
```

Open `http://localhost:4321` and log in with **123456**.

### 3. Set Your Own Password (Optional)

To use a custom password, create a `.dev.vars` file:

```bash
# Generate a hash for your password
npm run hash-password your-password

# Create .dev.vars and paste the hash
ACCESS_PASSWORD_HASH=sha256:YOUR_HASH_HERE
SESSION_SECRET=any-random-string-at-least-32-characters
```

### 4. Create R2 Bucket

Create a bucket in Cloudflare R2 and upload your photos. Update `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "your-bucket-name"
```

### 5. Update Site Data

Edit `src/data/site.ts` with real information:

```ts
export const site = {
  title: "Your Memorial Title",
  name: "Person's Name",
  years: "YYYY - YYYY",
  dedication: "A short dedication quote.",
};
```

### 6. Add Articles

Create `.md` files in `src/content/articles/`:

```markdown
---
title: "Article Title"
date: "2024-01-15"
excerpt: "Short summary shown in the list."
---

Your article content here...
```

### 7. Deploy

```bash
npm run build
npx wrangler pages deploy ./dist
```

## File Structure

```
├── src/
│   ├── components/     # Reusable Astro components
│   ├── content/
│   │   └── articles/   # Markdown articles
│   ├── data/
│   │   └── site.ts     # Site metadata & timeline data
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── lib/
│   │   └── auth.ts     # Password hashing & session cookies
│   ├── middleware.ts   # Route guards & security headers
│   └── pages/          # All page routes
├── scripts/
│   ├── astro-cli.mjs
│   └── hash-password.mjs
├── astro.config.mjs
├── wrangler.toml
└── package.json
```

## Security Notes

- Password is hashed with SHA-256 and stored as a Cloudflare secret.
- Sessions use HMAC-SHA-256 signed cookies with 30-day expiry.
- Private pages return `noindex, nofollow` to search engines.
- CSP restricts resources to same-origin only.

> **Default Password**: The project ships with a default password (`123456`) so it works immediately after cloning. **Change this before deploying to production** via Cloudflare Workers environment variables.

## License

MIT
