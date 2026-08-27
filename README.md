# Hyena Dart website

Project site and developer documentation for [Hyena Dart](https://github.com/Chandram-Dutta/hyena_dart), built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## Local development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

The development server prints its local URL. Documentation content lives in `src/content/docs/docs/`; the custom project homepage is `src/pages/index.astro`.

## Checks and production build

```bash
npm run check
npm run build
npm run preview
```

`npm run build` runs Astro's type/content checks before creating the static site in `dist/`. Starlight builds its local Pagefind search index as part of the production build.

## Structure

```text
src/
├── assets/              # Local project artwork
├── content/docs/        # Starlight documentation
├── layouts/             # Homepage layout
├── pages/               # Custom Astro routes
└── styles/              # Homepage and documentation themes
```

## Update documentation

Product behavior is defined by the source repository, especially:

- `lib/src/cli/cli_runner.dart`
- `lib/src/config/analyzer_config.dart`
- `lib/src/analyzer/`
- `lib/src/models/`
- `lib/src/reporters/`

Check source behavior rather than copying the package README when commands, defaults, metrics, or output shapes change.

## Deployment

This is a static site and does not require a server adapter. Deploy the contents of `dist/` to any static host.

Before the first deployment, set Astro's `site` value in `astro.config.mjs` to the canonical production origin. If deploying to GitHub project Pages without a custom domain, also set `base` to `/hyena_dart_website` and verify root-relative links under that base.
