# MS SQL Server Migration Notes

The MVP currently uses `DummyBibliometricRepository`. A future SQL-backed implementation should add `MssqlBibliometricRepository` that implements the same `BibliometricRepository` interface in `src/server/repositories/BibliometricRepository.ts`.

## Repository Methods To Replace

- `getArticles()`: replace dummy array reads with paged SQL projections and joins for journals, article categories, taxonomy headers, authors, affiliations, keywords, source indexing snapshots, references, citation edges, and citation summaries.
- `getArticleById(id)`: replace in-memory lookup with a parameterized query by article id plus joins for detail data, yearly citation points, source indexing, references, citing records, and co-citation candidates.
- `getJournals()`: query the `journals` lookup table.
- `getArticleCategories()`: query the `article_categories` lookup table.
- `getArticleTypes()`: query a lookup table or `SELECT DISTINCT article_type FROM articles`.

Filtering and sorting can remain in services during early migration, but production scale should push search, filters, sort order, and pagination into SQL queries.

## Suggested Tables

- `articles`
- `authors`
- `article_authors`
- `journals`
- `article_categories`
- `journal_taxonomy_headers`
- `article_source_indexing`
- `citation_snapshots`
- `article_references`
- `article_citations`
- `co_citation_edges`
- `yearly_citations`
- `journal_year_metrics`
- `manuscript_result_tables`
- `manuscript_result_values`

Useful optional tables include `keywords`, `article_keywords`, `affiliations`, and `author_affiliations` if author and institution analysis becomes a first-class feature.

## Suggested Indexes

- Index on `articles.journal_id`
- Index on `articles.publication_year`
- Index on `articles.article_type`
- Index on `articles.article_category_id`
- Index on `journal_taxonomy_headers(journal_id, level1, level2, level3)`
- Index on `article_source_indexing(source_name, snapshot_date, indexed)`
- Index on `article_citations(cited_article_id, citing_article_id)`
- Index on `article_references(article_id, referenced_article_id)`
- Unique index on `articles.doi`
- Full-text index on `articles.title`
- Full-text index on `articles.abstract`
- Composite index on `yearly_citations(article_id, citation_year)`
- Composite index on `journal_year_metrics(journal_id, publication_year)`

## Full-Text Search

The dummy search function currently lowercases title, abstract, DOI, journal, type, category, taxonomy header, keywords, authors, and affiliations, then performs simple substring matching. SQL Server Full-Text Search can replace this with `CONTAINS` or `FREETEXT` over title and abstract, plus targeted joins for DOI, author, keyword, taxonomy, and affiliation filters.

A production search query should combine:

- Full-text predicates for title and abstract relevance
- Exact DOI matching
- Structured filters for journal, year, article type, article category, ORA/NORA classification, source dataset, source snapshot, and indexing status
- Stable pagination with explicit sort columns

## Precomputed Metric Tables

Metric tables such as `journal_year_metrics` should be precomputed by ETL jobs rather than calculated on every web request. Bibliometric dashboards frequently aggregate across many records, years, journals, article categories, source snapshots, taxonomy groups, and citation windows. Precomputing reduces request latency, avoids repetitive expensive scans, and creates a reliable snapshot model for metrics like yearly article volume, citation totals, rolling 2-year citation windows, simulated journal impact factor views, quantile histograms, and network summaries.
