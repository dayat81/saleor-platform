terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "kubernetes" {
  host                   = "https://${module.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(module.gke.ca_certificate)
}

data "google_client_config" "default" {}

module "networking" {
  source = "../../modules/networking"
  
  project_id        = var.project_id
  region           = var.region
  environment      = var.environment
  vpc_name         = var.vpc_name
  subnet_name      = var.subnet_name
  pod_range_name   = var.pod_range_name
  svc_range_name   = var.svc_range_name
}

module "gke" {
  source = "../../modules/gke"
  
  project_id      = var.project_id
  region         = var.region
  environment    = var.environment
  cluster_name   = var.cluster_name
  vpc_name       = module.networking.vpc_name
  subnet_name    = module.networking.subnet_name
  pod_range_name = var.pod_range_name
  svc_range_name = var.svc_range_name
  
  node_count        = var.node_count
  machine_type      = var.machine_type
  disk_size_gb      = var.disk_size_gb
  preemptible       = var.preemptible
  auto_upgrade      = var.auto_upgrade
  auto_repair       = var.auto_repair
}

module "cloudsql" {
  source = "../../modules/cloudsql"
  
  project_id           = var.project_id
  region              = var.region
  environment         = var.environment
  database_name       = var.database_name
  database_version    = var.database_version
  database_tier       = var.database_tier
  disk_size           = var.database_disk_size
  backup_enabled      = var.database_backup_enabled
  backup_start_time   = var.database_backup_start_time
  authorized_networks = module.networking.vpc_cidr_block
  vpc_id             = module.networking.vpc_id
  private_vpc_connection = module.networking.private_vpc_connection
}

module "redis" {
  source = "../../modules/redis"
  
  project_id      = var.project_id
  region         = var.region
  environment    = var.environment
  redis_name     = var.redis_name
  redis_tier     = var.redis_tier
  memory_size_gb = var.redis_memory_size_gb
  vpc_id         = module.networking.vpc_id
}

module "storage" {
  source = "../../modules/storage"
  
  project_id        = var.project_id
  region           = var.region
  environment      = var.environment
  media_bucket     = var.media_bucket_name
  static_bucket    = var.static_bucket_name
  storage_class    = var.storage_class
  versioning       = var.storage_versioning
}