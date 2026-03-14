# Velqip Elasticsearch Module

Standalone TypeScript service that exposes product indexing/search APIs backed by Elasticsearch.

## What it includes

- Product index CRUD + bulk indexing
- Full-text search with filters, pagination, and sorting
- Autocomplete using Elasticsearch completion suggester
- Supabase sync job (`get_denormalized_products` by default)
- Index bootstrap script
- Deploy-ready Dockerfile

## Environment

Copy `.env.example` to `.env` and set values:

- `ES_URL` (required)
- `ES_API_KEY` for route auth (required for API usage)
- `ES_SERVER_API_KEY` or `ES_USERNAME`/`ES_PASSWORD` (optional Elasticsearch auth)
- `ES_PRODUCTS_INDEX` (default: `velqip_products`)
- `PORT` (default: `8081`)
- `ES_ROUTE_PREFIX` (default: `/elastic`)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (required for sync script)

## Run locally

```bash
npm install
npm run es:setup
npm run dev
```

Service endpoints:

- `GET /health`
- `GET /elastic/health`
- `POST /elastic/index-product`
- `POST /elastic/index-products-bulk`
- `DELETE /elastic/product/:variantId`
- `GET /elastic/search`
- `GET /elastic/autocomplete?prefix=...`

All `/elastic/*` routes require header:

`x-api-key: <ES_API_KEY>`

## Build + start

```bash
npm run build
npm start
```

## Docker deploy

```bash
docker build -t velqip-elastic-module .
docker run --env-file .env -p 8081:8081 velqip-elastic-module
```

## Docker Compose

Run the full stack from the `elasticsearch` folder:

```bash
docker-compose up -d --build
```

If you want custom secrets or Supabase sync credentials, add an `elasticsearch/.env` file first. `docker-compose` will pick it up automatically.

This compose stack starts:

- Elasticsearch on `http://localhost:9200`
- The Velqip Elasticsearch API on `http://localhost:8081`
- Kibana on `http://localhost:5601` when you enable the `observability` profile

The API container waits for Elasticsearch, creates the product index if needed, and then starts the service.

To start Kibana too:

```bash
docker-compose --profile observability up -d --build
```

## Operational scripts

- `npm run es:setup` creates the index if missing
- `npm run es:sync` fetches products from Supabase RPC and bulk indexes them
