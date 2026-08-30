# Hyena Dart website

Project site and developer documentation for [Hyena Dart](https://github.com/Chandram-Dutta/hyena_dart), built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## Local development

Requires Bun 1.3.10. Astro's tooling also requires Node.js 22.12 or newer.

```bash
bun install
bun run dev
```

The development server prints its local URL. Documentation content lives in `src/content/docs/docs/`; the custom project homepage is `src/pages/index.astro`.

## Checks and production build

```bash
bun run check
bun run build
bun run preview
```

`bun run build` runs Astro's type/content checks before creating the static site in `dist/`. Starlight builds its local Pagefind search index as part of the production build.

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

The production origin is `https://hyenadart.onlychan.xyz`. This is a fully
static Astro site, so Cloudflare serves `dist/` directly through Workers Static
Assets; it does not need the Cloudflare Astro adapter or runtime Worker code.

### Connect Workers Builds

1. In Cloudflare, open **Workers & Pages**, create an application, and import
   `Chandram-Dutta/hyena_dart_website` from GitHub.
2. Use these build settings:
   - Production branch: `main`
   - Build command: `bun install --frozen-lockfile && bun run build`
   - Deploy command: `bun run deploy`
   - Root directory: leave blank
3. Add these build variables:
   - `BUN_VERSION`: `1.3.10`
   - `SKIP_DEPENDENCY_INSTALL`: `true`
4. Save and deploy. Workers Builds creates its deployment token; no repository
   secret is required. The explicit install command keeps Cloudflare from
   falling back to npm and verifies the committed `bun.lock` without changing it.

`wrangler.jsonc` deploys only the generated static assets, uses the generated
`404.html` for missing routes, and attaches the Worker to
`hyenadart.onlychan.xyz`. Cloudflare creates the DNS record and TLS certificate
for that custom domain. The hostname must not already have a CNAME record; if
one exists, remove it before the first production deployment.

Pushes to `main` deploy to production. When non-production branch builds are
enabled in Cloudflare, Wrangler uploads preview versions without changing the
production route.

For an authenticated one-off deployment from a development machine:

```bash
bun install --frozen-lockfile
bun run build
bun run deploy
```
