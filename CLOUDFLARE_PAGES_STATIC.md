# Cloudflare Pages (Static Cards, No Workers)

This setup serves pre-generated SVG cards from static files only.
No Pages Functions are used, so Pages requests do not execute Workers.

## 1) Configure GitHub Secret

Set repository secret `PAT_1` with a GitHub Personal Access Token.

Required scopes:
- Public stats only: `public_repo` is enough.
- Include private stats: use a token that can read private repositories.

## 2) Card Configuration

Edit `static-cards.config.json`.

Example:

```json
{
  "outputDir": "public/cards",
  "cards": [
    {
      "endpoint": "stats",
      "output": "stats.svg",
      "query": {
        "username": "jj1guj",
        "show_icons": "true"
      }
    },
    {
      "endpoint": "top-langs",
      "output": "top-langs.svg",
      "query": {
        "username": "jj1guj",
        "layout": "compact"
      }
    }
  ]
}
```

Supported endpoints in the generator:
- `stats`
- `pin`
- `top-langs`
- `wakatime`
- `gist`

## 3) Generation Workflow

Workflow file: `.github/workflows/generate-static-cards.yml`

It runs:
- Manually (`workflow_dispatch`)
- Every 12 hours (`cron`)

Generated files are committed to `public/cards` when they change.

## 4) Cloudflare Pages Settings

In Cloudflare Pages project settings:
- Build command: leave empty
- Build output directory: `public`

After deploy, your card URLs look like:
- `/cards/stats.svg`
- `/cards/top-langs.svg`

## 5) Local Run

```bash
npm ci
npm run generate:static-cards
```

This writes SVG files into `public/cards`.
