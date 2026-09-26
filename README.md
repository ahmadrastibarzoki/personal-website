# Ahmad Rasti Barzoki — Personal Website

Personal website for Ahmad Rasti Barzoki, built with Astro and designed for fast static deployment.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The generated site is written to `dist/`.

## Cloudflare Pages

Use:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

The current canonical domain is configured as:

`https://ahmadrastibarzoki.ir`

When migrating to `.com`, update:

- `astro.config.mjs`
- `src/layouts/BaseLayout.astro`
- `public/robots.txt`
- `public/sitemap.xml`
