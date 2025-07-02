# Project Configuration
project_id = "saleor-platform-dev"
region     = "asia-southeast2"
zone       = "asia-southeast2-a"
environment = "dev"

# Networking
vpc_name       = "saleor-vpc-dev"
subnet_name    = "saleor-subnet-dev"
pod_range_name = "pod-range-dev"
svc_range_name = "svc-range-dev"

# GKE Configuration
cluster_name  = "saleor-gke-dev"
node_count    = 2
machine_type  = "e2-medium"
disk_size_gb  = 30
preemptible   = true
auto_upgrade  = true
auto_repair   = true

# Database Configuration
database_name               = "saleor-db-dev"
database_version           = "POSTGRES_15"
database_tier              = "db-f1-micro"
database_disk_size         = 20
database_backup_enabled    = true
database_backup_start_time = "03:00"

# Redis Configuration
redis_name           = "saleor-redis-dev"
redis_tier          = "BASIC"
redis_memory_size_gb = 1

# Storage Configuration
media_bucket_name    = "saleor-media-dev-unique-12345"
static_bucket_name   = "saleor-static-dev-unique-12345"
storage_class        = "STANDARD"
storage_versioning   = false