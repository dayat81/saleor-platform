# Saleor Platform GCP Deployment Plan with Terraform

## Overview

This document outlines the deployment strategy for Saleor Platform on Google Cloud Platform (GCP) using Terraform. The infrastructure supports three environments: Development (dev), Staging (stag), and Production (prod) in the Indonesia region.

## Architecture Overview

### Regional Configuration
- **Primary Region**: asia-southeast2 (Jakarta, Indonesia)
- **Multi-Zone Deployment**: Leveraging asia-southeast2-a, asia-southeast2-b, asia-southeast2-c for high availability

### Core Components

1. **Google Kubernetes Engine (GKE)**
   - Managed Kubernetes cluster for container orchestration
   - Autopilot mode for dev/staging, Standard mode for production
   - Node auto-scaling enabled

2. **Cloud SQL (PostgreSQL)**
   - Managed PostgreSQL 15 instances
   - High availability configuration for production
   - Automated backups and point-in-time recovery

3. **Memorystore (Redis)**
   - Managed Redis instances for caching and Celery broker
   - Standard tier for dev/staging, High availability for production

4. **Cloud Storage**
   - Media file storage with CDN integration
   - Separate buckets per environment

5. **Cloud Load Balancing**
   - Global HTTPS load balancer
   - SSL termination and auto-scaling

6. **Cloud Armor**
   - DDoS protection and WAF rules
   - IP allowlisting for staging/dev environments

## Terraform Module Structure

```
terraform/
├── modules/
│   ├── gke/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── versions.tf
│   ├── cloudsql/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── versions.tf
│   ├── redis/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── versions.tf
│   ├── storage/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── versions.tf
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── versions.tf
│   └── monitoring/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── versions.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── stag/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── main.tf
│       ├── variables.tf
│       ├── terraform.tfvars
│       └── backend.tf
├── global/
│   ├── iam/
│   │   └── main.tf
│   └── dns/
│       └── main.tf
└── scripts/
    ├── init-terraform.sh
    └── deploy.sh
```

## Resource Specifications

### Development Environment
```hcl
# GKE Cluster
cluster_mode = "autopilot"
min_nodes = 0
max_nodes = 3

# Cloud SQL
database_tier = "db-g1-small"
database_availability = "zonal"
backup_enabled = true
backup_start_time = "03:00"

# Redis
redis_tier = "basic"
redis_memory_size_gb = 1

# Storage
storage_class = "standard"
versioning_enabled = false
```

### Staging Environment
```hcl
# GKE Cluster
cluster_mode = "autopilot"
min_nodes = 1
max_nodes = 5

# Cloud SQL
database_tier = "db-n1-standard-1"
database_availability = "zonal"
backup_enabled = true
backup_start_time = "03:00"
point_in_time_recovery = true

# Redis
redis_tier = "basic"
redis_memory_size_gb = 2

# Storage
storage_class = "standard"
versioning_enabled = true
lifecycle_rules = true
```

### Production Environment
```hcl
# GKE Cluster
cluster_mode = "standard"
min_nodes = 3
max_nodes = 10
machine_type = "n2-standard-4"
disk_size_gb = 100
disk_type = "pd-ssd"

# Cloud SQL
database_tier = "db-n1-standard-4"
database_availability = "regional"
backup_enabled = true
backup_start_time = "03:00"
point_in_time_recovery = true
transaction_log_retention_days = 7

# Redis
redis_tier = "standard_ha"
redis_memory_size_gb = 5
redis_replica_count = 1

# Storage
storage_class = "standard"
versioning_enabled = true
lifecycle_rules = true
cdn_enabled = true
```

## Kubernetes Resources

### Namespace Structure
```yaml
- saleor-dev
- saleor-stag
- saleor-prod
```

### Service Deployments
1. **Saleor API**
   - Deployment with HPA (Horizontal Pod Autoscaler)
   - ConfigMap for environment variables
   - Secret for sensitive data
   - Service (ClusterIP)
   - Ingress configuration

2. **Saleor Dashboard**
   - Deployment with static configuration
   - ConfigMap for API endpoint
   - Service (ClusterIP)
   - Ingress configuration

3. **Celery Worker**
   - Deployment with resource limits
   - Shared volume mounts for media
   - No external exposure

4. **Celery Beat**
   - Single replica deployment
   - Persistent volume for schedule storage

## Security Configuration

### Network Security
- **VPC Configuration**
  - Custom VPC per environment
  - Private GKE clusters with authorized networks
  - Cloud NAT for outbound connectivity

- **Firewall Rules**
  - Deny all ingress by default
  - Allow specific ports for services
  - IP allowlisting for non-production environments

### Identity and Access Management (IAM)
```hcl
# Service Accounts
- gke-node-sa: GKE node service account
- cloudsql-proxy-sa: Cloud SQL proxy service account
- storage-admin-sa: GCS bucket management
- monitoring-sa: Monitoring and logging

# Workload Identity
- Enabled for production environment
- Service account mapping for pods
```

### Secrets Management
- **Secret Manager Integration**
  - Database credentials
  - API keys
  - JWT secrets
  - Third-party integrations

- **Kubernetes Secrets**
  - Encrypted at rest
  - RBAC policies for access control

## Monitoring and Observability

### Google Cloud Operations Suite
- **Cloud Monitoring**
  - Custom dashboards per environment
  - Resource utilization metrics
  - Application performance metrics

- **Cloud Logging**
  - Centralized log aggregation
  - Log-based metrics and alerts
  - 30-day retention (dev), 90-day (staging), 365-day (prod)

- **Cloud Trace**
  - Distributed tracing integration
  - Performance bottleneck identification

### Alerting Configuration
```yaml
alerts:
  - name: high-cpu-usage
    condition: cpu_usage > 80%
    duration: 5m
    
  - name: database-connection-pool
    condition: connection_pool_usage > 90%
    duration: 2m
    
  - name: api-response-time
    condition: p95_latency > 1000ms
    duration: 5m
```

## Deployment Procedures

### Initial Setup
```bash
# 1. Initialize GCP project
gcloud projects create saleor-platform-{env}
gcloud config set project saleor-platform-{env}

# 2. Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable secretmanager.googleapis.com

# 3. Create Terraform state bucket
gsutil mb -p saleor-platform-{env} -l asia-southeast2 gs://saleor-terraform-state-{env}
gsutil versioning set on gs://saleor-terraform-state-{env}

# 4. Initialize Terraform
cd terraform/environments/{env}
terraform init

# 5. Plan and apply
terraform plan -out=tfplan
terraform apply tfplan
```

### Continuous Deployment

#### GitHub Actions Workflow
```yaml
name: Deploy to GCP
on:
  push:
    branches:
      - main
      - staging
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set environment
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "ENV=prod" >> $GITHUB_ENV
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            echo "ENV=stag" >> $GITHUB_ENV
          else
            echo "ENV=dev" >> $GITHUB_ENV
          fi
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Terraform Apply
        run: |
          cd terraform/environments/${{ env.ENV }}
          terraform init
          terraform apply -auto-approve
```

### Rollback Procedures
```bash
# 1. Kubernetes rollback
kubectl rollout undo deployment/saleor-api -n saleor-{env}

# 2. Database rollback (from backup)
gcloud sql backups restore [BACKUP_ID] --restore-instance=[INSTANCE_NAME]

# 3. Terraform state rollback
terraform plan -destroy
terraform destroy -auto-approve
```

## Cost Optimization

### Resource Scheduling
- **Development Environment**
  - Auto-shutdown after business hours
  - Weekend suspension
  - Estimated savings: 65%

- **Staging Environment**
  - Reduced resources during off-peak
  - No weekend suspension
  - Estimated savings: 30%

### Committed Use Discounts
- 1-year commitment for production resources
- Estimated savings: 37% on compute resources

### Preemptible Instances
- Used for non-critical workloads (dev/staging)
- Celery workers in all environments
- Estimated savings: 60-91% on applicable workloads

## Migration Strategy

### Phase 1: Infrastructure Provisioning
1. Create GCP projects and enable APIs
2. Deploy base infrastructure with Terraform
3. Configure networking and security

### Phase 2: Database Migration
1. Export existing PostgreSQL data
2. Import to Cloud SQL instance
3. Validate data integrity
4. Update connection strings

### Phase 3: Application Deployment
1. Build and push Docker images to Artifact Registry
2. Deploy Kubernetes manifests
3. Configure ingress and SSL certificates
4. Update DNS records

### Phase 4: Testing and Validation
1. Smoke tests on all endpoints
2. Load testing for performance validation
3. Security scanning and penetration testing
4. Disaster recovery drill

### Phase 5: Cutover
1. Enable maintenance mode
2. Final data sync
3. DNS switch to GCP
4. Monitor application health
5. Remove maintenance mode

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups with 30-day retention
- **Media Files**: Object versioning and cross-region replication
- **Configuration**: GitOps with version control

### RTO/RPO Targets
- **Production**
  - RTO: 1 hour
  - RPO: 15 minutes
  
- **Staging**
  - RTO: 4 hours
  - RPO: 1 hour
  
- **Development**
  - RTO: 24 hours
  - RPO: 24 hours

### DR Procedures
1. **Database Failure**
   - Automatic failover to replica (prod)
   - Point-in-time recovery from backups

2. **Region Failure**
   - Deploy to alternate region (asia-southeast1)
   - Restore from cross-region backups

3. **Complete Platform Failure**
   - Terraform re-deployment from scratch
   - Data restoration from backups

## Compliance and Governance

### Data Residency
- All data stored within Indonesia region
- No cross-border data transfer by default

### Audit Logging
- Cloud Audit Logs enabled
- 365-day retention for production
- Integration with SIEM tools

### Compliance Standards
- PCI DSS ready infrastructure
- GDPR compliance through data isolation
- SOC 2 Type II compatible logging

## Estimated Costs

### Development Environment
- **Monthly**: $300-400 USD
- GKE Autopilot: $75
- Cloud SQL: $50
- Redis: $40
- Storage & Network: $35
- Other services: $100

### Staging Environment
- **Monthly**: $600-800 USD
- GKE Autopilot: $150
- Cloud SQL: $120
- Redis: $80
- Storage & Network: $100
- Other services: $150

### Production Environment
- **Monthly**: $2,500-3,500 USD
- GKE Standard: $800
- Cloud SQL HA: $600
- Redis HA: $400
- Storage & CDN: $300
- Load Balancing: $200
- Other services: $700

*Note: Costs are estimates and may vary based on actual usage*

## Next Steps

1. Review and approve the deployment plan
2. Set up GCP billing and budgets
3. Create service accounts and API keys
4. Initialize Terraform infrastructure
5. Begin phased migration

## Appendix

### Useful Commands
```bash
# Connect to GKE cluster
gcloud container clusters get-credentials saleor-{env} --region asia-southeast2

# Access Cloud SQL
gcloud sql connect saleor-db-{env} --user=saleor

# View logs
gcloud logging read "resource.type=k8s_container AND resource.labels.namespace_name=saleor-{env}"

# Check costs
gcloud billing budgets list --billing-account=BILLING_ACCOUNT_ID
```

### References
- [GCP Region Documentation](https://cloud.google.com/compute/docs/regions-zones)
- [GKE Best Practices](https://cloud.google.com/kubernetes-engine/docs/best-practices)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Saleor Deployment Guide](https://docs.saleor.io/docs/3.x/setup/deployment)