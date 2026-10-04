# Daoyu Wang’s homepage

A restrained bilingual academic homepage with Liquid Glass applied only to navigation, language/filter controls, and popup panels. Built with React, Vite, and [Liqui Design](https://liqui.design). The glass surfaces use `@liqui-design/glass`; the Button is copied from the upstream MIT-licensed registry, and tabs, popovers, and dialogs use Base UI. Tailwind CSS v4 supports the registry component. All interface icons use Lucide and inherit the site accent color.

## Local preview

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Language and theme choices persist locally. The original publications and projects remain in `publications.json` and `projects.json`. About, interests, awards, experience, and acknowledgments are preserved in `src/content.json`.

## Build and publish

```sh
npm run build
npm run preview
```

`dist/` is the complete static site, including images and all three standalone tools. GitHub Pages uses **GitHub Actions** as its build source. `.github/workflows/pages.yml` builds and deploys the static output on pushes to `main`.

## Browser behavior

Chromium renders displacement refraction. Safari and Firefox use Liqui Design’s automatic frosted fallback. Color dispersion is limited to a subtle amount on the navigation bar; cached displacement maps generate on size changes rather than continuously. Reduced motion and transparency preferences are respected.

## Restore the original

See [BACKUP.md](BACKUP.md) for the full working-directory backup and restoration instructions. `styles.css` and `scripts.js` are retained as original files and are not used by the new app.

## Credits

Original homepage: [Minimal Academic Website](https://github.com/yuhui-zh15/Minimal-Academic-Website). Glass material and registry Button: [Liqui Design](https://github.com/leefanv/liqui-design), MIT. See `THIRD_PARTY_NOTICES.md`.
