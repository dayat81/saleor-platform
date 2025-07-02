# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Saleor Platform is a Docker Compose-based orchestration environment for local development of the Saleor e-commerce ecosystem. It coordinates multiple services including the Core API, Dashboard, databases, cache, and development tools.

## Essential Commands

### Starting the Platform
```bash
# First-time setup
docker compose run --rm api python3 manage.py migrate
docker compose run --rm api python3 manage.py populatedb --createsuperuser

# Start all services
docker compose up

# Start backend services only
docker compose up api worker
```

### Common Development Tasks
```bash
# Run Django migrations
docker compose run --rm api python3 manage.py migrate

# Access Django shell
docker compose run --rm api python3 manage.py shell

# Execute management commands
docker compose run --rm api python3 manage.py <command>

# View logs for specific service
docker compose logs -f api
docker compose logs -f worker

# Restart specific service
docker compose restart api
```

### Database Operations
```bash
# Connect to PostgreSQL
docker compose exec db psql -U saleor -d saleor

# Reset database (WARNING: deletes all data)
docker compose down --volumes db
docker compose run --rm api python3 manage.py migrate
docker compose run --rm api python3 manage.py populatedb --createsuperuser

# E2E database setup
./setup-e2e-db.sh
```

### Troubleshooting
```bash
# Stop all services
docker compose stop

# Remove containers and rebuild
docker compose rm
docker compose build
docker compose up

# Free up Docker space
docker system prune
```

## Architecture Overview

### Service Topology
The platform runs 7 interconnected services through Docker Compose:

1. **api** (port 8000): Saleor Core GraphQL API
   - Django-based e-commerce backend
   - Depends on: db, redis, jaeger
   - Shares media volume with worker

2. **dashboard** (port 9000): React-based admin interface
   - Runs independently (no backend network)
   - Connects to API via GraphQL

3. **db** (port 5432): PostgreSQL 15 database
   - Credentials: saleor/saleor
   - Includes read-only replica user setup

4. **redis** (port 6379): Cache and message broker
   - Used by API for caching
   - Celery broker for worker tasks

5. **worker**: Celery background task processor
   - Handles async operations
   - Runs with beat scheduler for periodic tasks

6. **jaeger** (ports 16686, 4317, 4318): Distributed tracing
   - OpenTelemetry integration
   - UI available at http://localhost:16686

7. **mailpit** (ports 1025, 8025): Email testing
   - SMTP server on port 1025
   - Web UI at http://localhost:8025

### Data Flow
```
Dashboard → API → PostgreSQL
          ↓   ↓
        Worker → Redis
          ↓
       Mailpit

All services → Jaeger (observability)
```

### Key Integration Points

1. **Shared Media Volume**: API and Worker share `/app/media` for file processing
2. **Redis as Message Broker**: Celery tasks flow from API to Worker via Redis
3. **Environment Configuration**: 
   - `common.env`: Shared settings
   - `backend.env`: Backend-specific configuration
4. **Network Isolation**: All backend services use `saleor-backend-tier` network

### Configuration Patterns

- **Development Mode**: Services configured with hot-reload support
- **Observability**: Built-in OpenTelemetry/Jaeger integration
- **Security**: HTTP IP filtering enabled by default
- **Multi-channel**: Pre-configured default channel

## Service URLs

- **GraphQL API**: http://localhost:8000/graphql/
- **Admin Dashboard**: http://localhost:9000/
- **Jaeger UI**: http://localhost:16686/
- **Email Interface**: http://localhost:8025/
- **Database**: postgresql://saleor:saleor@localhost:5432/saleor

## Default Credentials

- **Admin account**: admin@example.com / admin
- **Database**: saleor / saleor