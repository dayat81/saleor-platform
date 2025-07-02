# Saleor Platform GCP Deployment Guide

## Quick Start

Deploy the complete Saleor Platform to Google Cloud Platform in Indonesia region with these commands:

```bash
# 1. Setup authentication (first time only)
./scripts/auth-setup.sh

# 2. Deploy infrastructure
./scripts/deploy-dev.sh

# 3. Deploy applications  
./scripts/deploy-k8s.sh
```

## Prerequisites

- Google Cloud SDK installed and authenticated
- Terraform installed (>= 1.0)
- kubectl installed
- Docker (for local development)

## Architecture

The deployment creates:

### Infrastructure (GCP)
- **GKE Cluster**: Kubernetes cluster in `asia-southeast2` (Jakarta)
- **Cloud SQL**: PostgreSQL 15 database
- **Memorystore Redis**: Cache and message broker
- **Cloud Storage**: Media and static file storage
- **VPC Network**: Private network with NAT gateway
- **Load Balancer**: Global HTTPS load balancer with SSL

### Applications (Kubernetes)
- **Saleor API**: GraphQL API backend (2 replicas)
- **Saleor Dashboard**: React admin interface (2 replicas)
- **Saleor Storefront**: Next.js frontend (1 replica)
- **Celery Worker**: Background task processor (1 replica)
- **Celery Beat**: Periodic task scheduler (1 replica)

## Deployment Steps

### 1. Authentication Setup (First Time Only)

```bash
./scripts/auth-setup.sh
```

This script:
- Authenticates with Google Cloud
- Sets up Application Default Credentials for Terraform
- Lists available projects
- Sets default project

### 2. Infrastructure Deployment

```bash
./scripts/deploy-dev.sh
```

This script:
- Verifies authentication
- Creates GCP project: `saleor-platform-dev`
- Enables required APIs
- Creates Terraform state bucket
- Deploys infrastructure with Terraform
- Configures kubectl with cluster credentials

### 3. Application Deployment

```bash
./scripts/deploy-k8s.sh
```

This script:
- Updates secrets from Cloud SQL and Redis
- Deploys Kubernetes manifests
- Runs database migrations
- Creates superuser account
- Populates sample data
- Configures ingress and SSL

## Access Information

### After Deployment

The deployment provides multiple access methods:

#### Production URLs (requires DNS setup)
- **API**: `https://api-dev.saleor.example.com/graphql/`
- **Dashboard**: `https://dashboard-dev.saleor.example.com/`
- **Storefront**: `https://storefront-dev.saleor.example.com/`

#### Local Access (port forwarding)
```bash
# API
kubectl port-forward svc/saleor-api 8000:8000 -n saleor-dev

# Dashboard  
kubectl port-forward svc/saleor-dashboard 9000:80 -n saleor-dev

# Storefront
kubectl port-forward svc/saleor-storefront 3000:3000 -n saleor-dev
```

### Default Credentials
- **Email**: admin@example.com
- **Password**: admin

## DNS Configuration

1. Get the static IP:
```bash
gcloud compute addresses describe saleor-dev-ip --global --format="value(address)"
```

2. Create DNS A records:
```
api-dev.saleor.example.com     -> STATIC_IP
dashboard-dev.saleor.example.com -> STATIC_IP  
storefront-dev.saleor.example.com -> STATIC_IP
```

## Monitoring & Management

### View Resources
```bash
# Pods
kubectl get pods -n saleor-dev

# Services
kubectl get svc -n saleor-dev

# Ingress
kubectl get ingress -n saleor-dev

# HPA (Auto-scaling)
kubectl get hpa -n saleor-dev
```

### Logs
```bash
# API logs
kubectl logs -f deployment/saleor-api -n saleor-dev

# Worker logs
kubectl logs -f deployment/saleor-worker -n saleor-dev

# Dashboard logs
kubectl logs -f deployment/saleor-dashboard -n saleor-dev
```

### Database Access
```bash
# Connect to Cloud SQL
gcloud sql connect saleor-db-dev --user=saleor

# Database management via API pod
kubectl exec -it deployment/saleor-api -n saleor-dev -- python manage.py shell
```

## Scaling

### Manual Scaling
```bash
# Scale API
kubectl scale deployment saleor-api --replicas=5 -n saleor-dev

# Scale Dashboard
kubectl scale deployment saleor-dashboard --replicas=3 -n saleor-dev
```

### Auto-scaling
HPA is configured for:
- **API**: 1-5 replicas (70% CPU, 80% Memory)
- **Dashboard**: 1-3 replicas (70% CPU)

## Cost Optimization

### Development Environment (~$400/month)
- GKE Autopilot with preemptible nodes
- db-f1-micro Cloud SQL instance
- Basic Redis tier (1GB)
- Standard storage class

### Resource Management
```bash
# Stop cluster (save costs)
gcloud container clusters resize saleor-gke-dev --num-nodes=0 --region=asia-southeast2

# Restart cluster
gcloud container clusters resize saleor-gke-dev --num-nodes=2 --region=asia-southeast2
```

## Troubleshooting

### Common Issues

#### 1. VPC Private Service Connection Error
```
Error: failed to create instance because the network doesn't have at least 1 private services connection
```

**Solution**: Run the VPC connection fix script:
```bash
./scripts/fix-vpc-connection.sh
```

Then retry the Terraform deployment:
```bash
cd terraform/environments/dev
terraform apply
```

#### 2. Pod CrashLoopBackOff
```bash
kubectl describe pod POD_NAME -n saleor-dev
kubectl logs POD_NAME -n saleor-dev
```

#### 2. Database Connection Issues
```bash
# Check secrets
kubectl get secret saleor-secrets -n saleor-dev -o yaml

# Test database connectivity
kubectl exec -it deployment/saleor-api -n saleor-dev -- python manage.py dbshell
```

#### 3. Redis Connection Issues
```bash
# Check Redis status
gcloud redis instances describe saleor-redis-dev --region=asia-southeast2

# Test Redis connectivity
kubectl exec -it deployment/saleor-api -n saleor-dev -- python -c "import redis; r=redis.from_url('REDIS_URL'); print(r.ping())"
```

#### 4. Ingress Issues
```bash
# Check ingress status
kubectl describe ingress saleor-ingress -n saleor-dev

# Check certificate status
kubectl describe managedcertificate saleor-dev-cert -n saleor-dev
```

## Update Deployment

### Infrastructure Updates
```bash
cd terraform/environments/dev
terraform plan
terraform apply
```

### Application Updates
```bash
# Update image
kubectl set image deployment/saleor-api saleor-api=ghcr.io/saleor/saleor:3.16 -n saleor-dev

# Restart deployment
kubectl rollout restart deployment/saleor-api -n saleor-dev
```

## Cleanup

### Delete Applications
```bash
kubectl delete namespace saleor-dev
```

### Delete Infrastructure
```bash
cd terraform/environments/dev
terraform destroy
```

### Delete Project
```bash
gcloud projects delete saleor-platform-dev
```

## Security Considerations

- Private GKE cluster with authorized networks
- Cloud SQL with private IP only
- Secrets stored in Secret Manager
- HTTPS termination at load balancer
- Pod security contexts enabled
- Network policies for inter-pod communication

## Backup Strategy

- **Database**: Daily automated backups (7-day retention)
- **Media Files**: Object versioning enabled
- **Configuration**: All infrastructure as code in Git

## Support

For issues:
1. Check pod logs: `kubectl logs -f deployment/DEPLOYMENT_NAME -n saleor-dev`
2. Check resource status: `kubectl describe RESOURCE_TYPE RESOURCE_NAME -n saleor-dev`
3. Review GCP console for infrastructure issues
4. Check Terraform state for infrastructure drift

## Next Steps

1. Set up monitoring with Cloud Operations Suite
2. Configure CI/CD pipeline with GitHub Actions
3. Set up staging and production environments
4. Implement backup and disaster recovery procedures
5. Configure custom domain and SSL certificates