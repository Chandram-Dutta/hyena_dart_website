import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const sourceRepository = 'https://github.com/Chandram-Dutta/hyena_dart';
const socialCardUrl =
  'https://hyenadart.onlychan.xyz/hyena-dart-social-card.png';
const socialCardAlt =
  'Hyena Dart — find dead code and measure complexity in Dart and Flutter projects.';

export default defineConfig({
  site: 'https://hyenadart.onlychan.xyz',
  output: 'static',
  vite: {
    preview: {
      allowedHosts: ['.onamp.dev'],
    },
  },
  integrations: [
    starlight({
      title: 'Hyena Dart',
      description:
        'Developer documentation for Hyena, a dead-code and complexity analyzer for Dart and Flutter projects.',
      favicon: '/favicon.svg',
      logo: {
        src: './src/assets/hyena-logo.webp',
        alt: 'Hyena Dart',
      },
      social: [
        {
          icon: 'github',
          label: 'Hyena Dart on GitHub',
          href: sourceRepository,
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/Chandram-Dutta/hyena_dart_website/edit/main/',
      },
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: socialCardUrl },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:secure_url', content: socialCardUrl },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:type', content: 'image/png' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:width', content: '1200' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:height', content: '630' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:alt', content: socialCardAlt },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:card', content: 'summary_large_image' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: socialCardUrl },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image:alt', content: socialCardAlt },
        },
        {
          tag: 'script',
          content: `document.addEventListener('DOMContentLoaded', () => {
            for (const table of document.querySelectorAll('.sl-markdown-content table')) {
              table.tabIndex = 0;
            }
          });`,
        },
      ],
      disable404Route: true,
      customCss: ['./src/styles/starlight.css'],
      expressiveCode: {
        styleOverrides: {
          borderRadius: '0.25rem',
        },
      },
      sidebar: [
        { label: 'Project home', link: '/' },
        {
          label: 'Start here',
          items: [
            { slug: 'docs' },
            { slug: 'docs/installation' },
            { slug: 'docs/getting-started' },
            { slug: 'docs/migrating-to-v2' },
          ],
        },
        {
          label: 'Use Hyena',
          items: [
            { slug: 'docs/cli-reference' },
            { slug: 'docs/configuration' },
            { slug: 'docs/workspaces' },
            { slug: 'docs/reports' },
            { slug: 'docs/ci' },
            { slug: 'docs/safe-ai-mcp' },
          ],
        },
        {
          label: 'Analysis',
          items: [
            { slug: 'docs/analysis/dead-code' },
            { slug: 'docs/analysis/complexity' },
          ],
        },
        {
          label: 'Developer guide',
          items: [
            { slug: 'docs/library-api' },
            { slug: 'docs/architecture' },
          ],
        },
      ],
    }),
  ],
});
