# Saleor Platform GCP Deployment Guide

This guide provides comprehensive instructions for deploying the Saleor e-commerce platform to Google Cloud Platform using Cloud Run for containerized services and managed services for data persistence.

## Architecture Overview

The deployment uses the following GCP services:

### **Core Services (Cloud Run)**
- **saleor-api**: Core Saleor GraphQL API
- **saleor-worker**: Celery background task processor
- **saleor-dashboard**: React-based admin interface
- **saleor-storefront**: Customer-facing Next.js frontend
- **saleor-backoffice**: F&B management interface
- **saleor-chat-service**: Customer chat service

### **Managed Services**
- **Cloud SQL PostgreSQL 15**: Primary database
- **Memorystore Redis**: Caching and Celery message broker
- **Cloud Storage**: Media files and static assets
- **Secret Manager**: Environment variables and API keys
- **Cloud Trace**: Distributed tracing
- **Cloud Monitoring**: Observability and alerting

## Prerequisites

Before starting the deployment, ensure you have:

1. **Google Cloud SDK** installed and configured
2. **Terraform** (>= 1.0) installed
3. **Docker** installed and running
4. **Active GCP billing account**
5. **Appropriate GCP permissions** (Project Owner or equivalent)

## Quick Start Deployment

### Step 1: Clone and Prepare

```bash
cd /home/ptsec/saleor-platform
```

### Step 2: Update Project Configuration

Edit the project ID in the following files to match your desired project name:

```bash
# Update terraform/environments/prod/variables.tf
# Update deploy-gcp.sh
# Update verify-deployment.sh
# Update monitoring-setup.sh
```

### Step 3: Execute Deployment

```bash
# Make scripts executable (if not already done)
chmod +x deploy-gcp.sh verify-deployment.sh monitoring-setup.sh

# Run the complete deployment
./deploy-gcp.sh
```

### Step 4: Verify Deployment

```bash
# Verify all services are running correctly
./verify-deployment.sh
```

### Step 5: Set up Monitoring

```bash
# Configure comprehensive monitoring
./monitoring-setup.sh
```

## Manual Deployment Steps

If you prefer to run the deployment manually, follow these detailed steps:

### 1. GCP Project Setup

```bash
export PROJECT_ID="saleor-platform-prod"
export REGION="us-central1"
export ZONE="us-central1-a"

# Create project
gcloud projects create $PROJECT_ID --name="Saleor E-commerce Platform"
gcloud config set project $PROJECT_ID

# Enable APIs
gcloud services enable \
  cloudsql.googleapis.com \
  redis.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  cloudtrace.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com

# Create Artifact Registry
gcloud artifacts repositories create saleor-repo \
  --repository-format=docker \
  --location=$REGION \
  --description="Saleor platform container images"

gcloud auth configure-docker $REGION-docker.pkg.dev
```

### 2. Infrastructure Deployment

```bash
cd terraform/environments/prod

# Create Terraform state bucket
gsutil mb gs://saleor-terraform-state-prod
gsutil versioning set on gs://saleor-terraform-state-prod

# Deploy infrastructure
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 3. Build and Push Container Images

```bash
export ARTIFACT_REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/saleor-repo"

# Build Saleor API
docker build -t $ARTIFACT_REGISTRY/saleor-api:latest \
  --build-arg="SALEOR_IMAGE=ghcr.io/saleor/saleor:3.21" \
  -f - . <<'EOF'
FROM ghcr.io/saleor/saleor:3.21
COPY common.env backend.env /app/
EOF
docker push $ARTIFACT_REGISTRY/saleor-api:latest

# Build Dashboard
docker build -t $ARTIFACT_REGISTRY/saleor-dashboard:latest \
  --build-arg="DASHBOARD_IMAGE=ghcr.io/saleor/saleor-dashboard:latest" \
  -f - . <<'EOF'
FROM ghcr.io/saleor/saleor-dashboard:latest
EOF
docker push $ARTIFACT_REGISTRY/saleor-dashboard:latest

# Build custom services
cd saleor-storefront
docker build -t $ARTIFACT_REGISTRY/saleor-storefront:latest -f Dockerfile.production .
docker push $ARTIFACT_REGISTRY/saleor-storefront:latest
cd ..

cd saleor-backoffice
docker build -t $ARTIFACT_REGISTRY/saleor-backoffice:latest -f Dockerfile.production .
docker push $ARTIFACT_REGISTRY/saleor-backoffice:latest
cd ..

cd saleor-chat-service
docker build -t $ARTIFACT_REGISTRY/saleor-chat-service:latest -f Dockerfile.production .
docker push $ARTIFACT_REGISTRY/saleor-chat-service:latest
cd ..
```

### 4. Deploy Cloud Run Services

```bash
# Get infrastructure outputs
cd terraform/environments/prod
DATABASE_CONNECTION_NAME=$(terraform output -raw database_connection_name)
REDIS_HOST=$(terraform output -raw redis_host)
REDIS_PORT=$(terraform output -raw redis_port)
VPC_CONNECTOR=$(terraform output -raw vpc_connector_name)
cd ../../..

# Deploy API
gcloud run deploy saleor-api \
  --image $ARTIFACT_REGISTRY/saleor-api:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --vpc-connector $VPC_CONNECTOR \
  --set-env-vars="CELERY_BROKER_URL=redis://$REDIS_HOST:$REDIS_PORT/1" \
  --set-secrets="SECRET_KEY=saleor-django-secret-key:latest"

# Deploy other services...
# (See deploy-gcp.sh for complete service deployment commands)
```

### 5. Initialize Database

```bash
# Run migrations
gcloud run jobs create saleor-migrate \
  --image $ARTIFACT_REGISTRY/saleor-api:latest \
  --region $REGION \
  --vpc-connector $VPC_CONNECTOR \
  --command="python" \
  --args="manage.py,migrate"

gcloud run jobs execute saleor-migrate --region $REGION --wait

# Populate with sample data
gcloud run jobs create saleor-populate \
  --image $ARTIFACT_REGISTRY/saleor-api:latest \
  --region $REGION \
  --vpc-connector $VPC_CONNECTOR \
  --command="python" \
  --args="manage.py,populatedb,--createsuperuser"

gcloud run jobs execute saleor-populate --region $REGION --wait
```

## Configuration

### Environment Variables

The deployment uses the following key environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `CELERY_BROKER_URL`: Redis connection for Celery
- `SECRET_KEY`: Django secret key (stored in Secret Manager)
- `GEMINI_API_KEY`: API key for chat service (stored in Secret Manager)

### Secrets Management

All sensitive configuration is stored in Google Secret Manager:

- `saleor-django-secret-key`: Django application secret
- `saleor-db-password`: Database password
- `saleor-gemini-api-key`: Gemini API key for chat service

### Networking

The deployment uses a VPC network with:
- Private IP ranges for Cloud SQL and Redis
- VPC Connector for Cloud Run services to access managed services
- Proper firewall rules for secure communication

## Monitoring and Observability

### Built-in Monitoring

The deployment includes:
- **Cloud Monitoring**: Metrics and dashboards
- **Cloud Logging**: Centralized log management
- **Cloud Trace**: Distributed tracing
- **Uptime Checks**: Service availability monitoring

### Custom Alerts

Alerting policies are created for:
- Service availability
- High CPU/memory usage
- Database connection issues
- Response latency thresholds

### Dashboards

Custom dashboards show:
- Request rates and latency
- Database and Redis performance
- Error rates and patterns
- Infrastructure health

## Security Considerations

### Network Security
- VPC isolation for backend services
- Private IP addresses for databases
- SSL/TLS encryption for all connections

### Access Control
- IAM roles with least privilege principle
- Service accounts for Cloud Run services
- Secret Manager for sensitive data

### Data Protection
- Encrypted storage (Cloud SQL, Redis, Cloud Storage)
- Automated backups with point-in-time recovery
- SSL certificate management

## Performance Optimization

### Scaling Configuration
- **API Service**: 1-10 instances, 2 CPU, 2Gi memory
- **Worker Service**: 1-5 instances, 1 CPU, 1Gi memory
- **Frontend Services**: Auto-scaling based on traffic

### Caching Strategy
- Redis for application caching
- CDN for static assets (can be added via Cloud CDN)
- Database query optimization

### Resource Optimization
- Container image optimization
- Cold start minimization
- Resource requests tuning

## Backup and Disaster Recovery

### Automated Backups
- **Cloud SQL**: Daily automated backups with 7-day retention
- **Redis**: Persistence enabled with regular snapshots
- **Storage**: Versioning enabled for media files

### Disaster Recovery
- Multi-region deployment capability
- Database replica setup for read scaling
- Infrastructure as Code for rapid reconstruction

## Cost Optimization

### Resource Management
- Preemptible instances where appropriate
- Auto-scaling to match demand
- Regular resource utilization review

### Storage Optimization
- Lifecycle policies for old data
- Appropriate storage classes
- Regular cleanup of unused resources

## Troubleshooting

### Common Issues

1. **Service Not Starting**
   - Check logs: `gcloud run services logs read saleor-api --region=us-central1`
   - Verify environment variables and secrets
   - Check VPC connector configuration

2. **Database Connection Issues**
   - Verify Cloud SQL instance is running
   - Check private IP configuration
   - Validate database credentials in Secret Manager

3. **Redis Connection Issues**
   - Confirm Redis instance is ready
   - Check VPC network configuration
   - Verify connection string format

4. **Image Build Failures**
   - Check Docker daemon is running
   - Verify Artifact Registry permissions
   - Review Dockerfile syntax

### Diagnostic Commands

```bash
# Check service status
gcloud run services list --region=us-central1

# View service logs
gcloud run services logs read SERVICE_NAME --region=us-central1

# Check infrastructure status
gcloud sql instances list
gcloud redis instances list --region=us-central1

# Test connectivity
gcloud run services describe saleor-api --region=us-central1
```

## Maintenance

### Regular Tasks
- Monitor resource usage and costs
- Review and update security policies
- Apply updates to base images
- Backup verification and testing

### Updates and Rollbacks
- Use Cloud Build for CI/CD pipelines
- Implement blue-green deployments
- Maintain rollback procedures
- Test updates in staging environment

## Next Steps

After successful deployment:

1. **Custom Domain Setup**: Configure your own domain names
2. **SSL Certificates**: Set up managed SSL certificates
3. **Email Service**: Configure SendGrid or similar service
4. **CI/CD Pipeline**: Implement automated deployments
5. **Load Testing**: Verify performance under load
6. **Security Hardening**: Implement additional security measures

## Support

For issues and questions:
- Review Cloud Run documentation
- Check Saleor platform documentation
- Monitor GCP status page for service issues
- Use GCP support channels for infrastructure problems

---

This deployment provides a production-ready Saleor e-commerce platform on GCP with enterprise-grade security, monitoring, and scalability features.