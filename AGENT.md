# AGENT.md

## Essential Commands
```bash
# Platform startup
docker compose run --rm api python3 manage.py migrate
docker compose run --rm api python3 manage.py populatedb --createsuperuser
docker compose up

# Testing
docker compose run api pytest  # Backend API tests
cd saleor-chat-service && npm test  # Chat service unit tests
cd saleor-chat-service && npm run test:e2e  # E2E tests
./setup-e2e-db.sh  # E2E database setup

# GCP Serverless Deployment
./deploy-gcp.sh  # Deploy complete Saleor platform to Google Cloud Run
python verify_endpoints_simple.py  # Verify all deployed endpoints
gcloud run jobs execute saleor-migrate --region us-central1  # Run database migrations

# Linting & Code Quality
cd saleor-backoffice && npm run lint  # Backoffice Next.js linting
cd saleor-storefront && npm run lint  # Storefront Next.js linting
cd saleor-chat-service && npm run lint  # Chat service TypeScript linting
```

## Architecture
- **Docker Compose orchestration** with 7 services: api (Django/GraphQL), dashboard (React), db (PostgreSQL), redis, worker (Celery), jaeger (tracing), mailpit (email testing)
- **Main API**: Saleor Core 3.21 on port 8000 with GraphQL endpoint at `/graphql/`
- **Custom services**: saleor-backoffice (Next.js, port 3001), saleor-storefront (Next.js), saleor-chat-service (Node.js/TypeScript)
- **Database**: PostgreSQL 15 with credentials saleor/saleor
- **Default admin**: admin@example.com / admin

## Code Style Guidelines
- **Frontend**: Next.js 13+ app router, TypeScript strict mode, ESLint with eslint-config-next
- **Styling**: Tailwind CSS with custom design system (backoffice), PostCSS + Autoprefixer
- **File naming**: Component directories, `.ts/.tsx` extensions, `@/*` path aliases
- **Chat service**: Stricter TypeScript config with noImplicitAny, strictNullChecks enabled
