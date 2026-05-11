# Cardiology Bibliometric Explorer

Local development-ready MVP foundation for a cardiology bibliometric analytics web application. The product direction is similar in spirit to scholarly analytics portals, but the current implementation is deliberately scoped to a clean synthetic-data MVP.

## What Is Included

- Next.js App Router with TypeScript
- Tailwind CSS visual system
- Apache ECharts for every chart and graph visualization
- Reusable `EChartCard` wrapper for responsive chart rendering
- Deterministic dummy article generation with a fixed seed
- Extracted CLEAR-CARD manuscript result tables rendered as interactive Apache ECharts views
- Article-level source badges for Scopus, iCite, and WoS indexing snapshots
- Citation trajectories, cumulative trajectories, quantile histograms, references, citing records, and co-citation graphs
- Repository and service layers that can later be replaced with MS SQL Server-backed implementations
- Home dashboard, article explorer, results atlas, article detail pages, and lightweight navigation foundation pages

## Synthetic Data Notice

The current article-level dataset is synthetic dummy data. The app does not connect to a real database, does not call external APIs, and does not use publisher or journal assets. Dummy article records cover approximately 1,200 cardiology articles from 2008 through 2022 across:

- Journal of the American College of Cardiology
- Circulation
- European Heart Journal
- JAMA Cardiology

The generator includes article types, ORA/NORA classification, CLEAR-CARD-style article categories, journal taxonomy headers, abstracts, DOI-like identifiers, authors, affiliations, page spans, keywords, indexing badges, source-specific original categories, references, citing links, total citation counts, 2-year citation counts, fitness, and yearly citation trajectories. Citation counts are intentionally skewed so a small number of dummy articles are highly cited.

The attached CLEAR-CARD manuscript files are also parsed into local structured data for the Results Atlas. Those extracted supplemental table values are stored locally in `src/server/data/researchResults.json` and visualized interactively; article-level records remain synthetic.

## Visual Direction

The UI is JACC-inspired in the broad sense of a serious cardiovascular academic publishing aesthetic: deep navy, restrained crimson accents, compact metadata, thin dividers, dense tables, and a clean white content surface. It does not use the JACC logo, ACC logo, exact JACC layouts, trademarked visual elements, or any external JACC/ACC assets.

## Install

```bash
npm install
```

Use a Node.js runtime available in the same shell where you run the app. In WSL, install Linux Node.js inside WSL or use WSL 2; using a Windows Node/npm shim from a WSL 1 shell can create non-executable package shims or fail before Next.js starts.

If `npm run dev` prints a UNC path such as `\\wsl.localhost\Ubuntu\...` and then says `UNC paths are not supported` or tries to write to `C:\Windows\.next`, the app is being launched by Windows Node/npm from inside WSL. Confirm with:

```bash
which node
which npm
```

Both should point to Linux paths such as `/usr/bin/node`, `/usr/bin/npm`, or `~/.nvm/...`, not `/mnt/c/Program Files/nodejs/...`. After installing Linux Node inside WSL, reinstall dependencies from the WSL shell:

```bash
rm -rf node_modules
npm install
npm run dev
```

## Run Development Server

```bash
npm run dev
```

Then open the local URL printed by Next.js, usually `http://localhost:3000`.

## Run Production Build Locally

```bash
npm run build
npm run start
```

## Docker

Build and run the production image directly:

```bash
docker build -t clear-card-web .
docker run --rm -p 3000:3000 clear-card-web
```

Or use Docker Compose:

```bash
docker compose up --build
```

The container serves the Next.js standalone production server on `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Project Structure

```text
src/app                 Next.js routes and page composition
src/components          Reusable layout, table, filter, metric, and chart components
src/components/charts   Apache ECharts wrapper and chart option factories
src/lib                 Formatting and search parameter utilities
src/server/data         Deterministic dummy data generation and extracted local manuscript result tables
src/server/repositories Repository interface and dummy repository implementation
src/server/services     Search, detail lookup, filtering, sorting, and metric logic
src/types               Shared TypeScript domain types
```

## Data Access Architecture

Frontend pages do not import dummy data directly. Pages call services, services call the `BibliometricRepository` interface, and the current repository implementation is `DummyBibliometricRepository`. A future `MssqlBibliometricRepository` can implement the same interface with parameterized SQL Server queries.

See `MSSQL_MIGRATION_NOTES.md` for the suggested schema, repository replacement points, full-text search approach, and metric table strategy.

## Charts

All charts and graph-style visualizations use Apache ECharts. This includes bar charts, line charts, trajectory charts, quantile histograms, the citation network, and co-citation graph. This MVP uses `echarts` and `echarts-for-react`; it does not use Recharts, Chart.js, Plotly, D3, Streamlit, or Shiny.
