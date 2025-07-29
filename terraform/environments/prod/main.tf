terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
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

# Generate random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Generate random secret key for Django
resource "random_password" "secret_key" {
  length  = 50
  special = true
}

# Cloud SQL Instance
resource "google_sql_database_instance" "saleor_db" {
  name             = var.database_name
  database_version = var.database_version
  region           = var.region
  deletion_protection = false

  settings {
    tier                        = var.database_tier
    availability_type          = "REGIONAL"
    disk_size                  = var.database_disk_size
    disk_type                  = "PD_SSD"
    disk_autoresize           = true
    disk_autoresize_limit     = 100

    backup_configuration {
      enabled                        = var.database_backup_enabled
      start_time                     = var.database_backup_start_time
      location                       = var.region
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }

    ip_configuration {
      ipv4_enabled                                  = true
      private_network                               = google_compute_network.vpc.id
      enable_private_path_for_google_cloud_services = true
      require_ssl                                   = true
      
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }
  }

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Database
resource "google_sql_database" "saleor" {
  name     = "saleor"
  instance = google_sql_database_instance.saleor_db.name
}

# Database user
resource "google_sql_user" "saleor_user" {
  name     = "saleor"
  instance = google_sql_database_instance.saleor_db.name
  password = random_password.db_password.result
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "saleor-vpc-${var.environment}"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "saleor-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "services-range"
    ip_cidr_range = "192.168.1.0/24"
  }

  secondary_ip_range {
    range_name    = "pod-range"
    ip_cidr_range = "192.168.64.0/22"
  }
}

# Private VPC connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# VPC Connector for Cloud Run
resource "google_vpc_access_connector" "connector" {
  name          = var.vpc_connector_name
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc.name
  region        = var.region
}

# Redis instance
resource "google_redis_instance" "saleor_redis" {
  name           = var.redis_name
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size_gb
  region         = var.region
  
  authorized_network = google_compute_network.vpc.id
  redis_version      = "REDIS_6_X"
  
  display_name = "Saleor Redis Cache"
}

# Media storage bucket
resource "google_storage_bucket" "media_bucket" {
  name          = "${var.media_bucket_name}-${random_id.bucket_suffix.hex}"
  location      = var.region
  storage_class = var.storage_class

  versioning {
    enabled = var.storage_versioning
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# Static files storage bucket
resource "google_storage_bucket" "static_bucket" {
  name          = "${var.static_bucket_name}-${random_id.bucket_suffix.hex}"
  location      = var.region
  storage_class = var.storage_class

  versioning {
    enabled = var.storage_versioning
  }
}

# Random suffix for bucket names (must be globally unique)
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# Secrets in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "saleor-db-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

resource "google_secret_manager_secret" "django_secret_key" {
  secret_id = "saleor-django-secret-key"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "django_secret_key" {
  secret      = google_secret_manager_secret.django_secret_key.id
  secret_data = random_password.secret_key.result
}

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "saleor-gemini-api-key"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "gemini_api_key" {
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = "AIzaSyDc5iF5xLH0iujbB3jo0h94tWKiFm6IGYo"
}

# Output values
output "database_connection_name" {
  value = google_sql_database_instance.saleor_db.connection_name
}

output "database_ip" {
  value = google_sql_database_instance.saleor_db.ip_address
}

output "redis_host" {
  value = google_redis_instance.saleor_redis.host
}

output "redis_port" {
  value = google_redis_instance.saleor_redis.port
}

output "media_bucket_url" {
  value = "gs://${google_storage_bucket.media_bucket.name}"
}

output "static_bucket_url" {
  value = "gs://${google_storage_bucket.static_bucket.name}"
}

output "vpc_connector_name" {
  value = google_vpc_access_connector.connector.name
}