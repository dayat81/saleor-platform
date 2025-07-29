variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "saleor-platform-20250728132114"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

# Cloud SQL variables
variable "database_name" {
  description = "Database instance name"
  type        = string
  default     = "saleor-db-prod"
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "database_tier" {
  description = "Database tier"
  type        = string
  default     = "db-g1-small"
}

variable "database_disk_size" {
  description = "Database disk size in GB"
  type        = number
  default     = 50
}

variable "database_backup_enabled" {
  description = "Enable database backups"
  type        = bool
  default     = true
}

variable "database_backup_start_time" {
  description = "Database backup start time"
  type        = string
  default     = "03:00"
}

# Redis variables
variable "redis_name" {
  description = "Redis instance name"
  type        = string
  default     = "saleor-redis-prod"
}

variable "redis_tier" {
  description = "Redis tier"
  type        = string
  default     = "STANDARD_HA"
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 2
}

# Storage variables
variable "media_bucket_name" {
  description = "Media bucket name"
  type        = string
  default     = "saleor-media-prod"
}

variable "static_bucket_name" {
  description = "Static files bucket name"
  type        = string
  default     = "saleor-static-prod"
}

variable "storage_class" {
  description = "Storage class"
  type        = string
  default     = "STANDARD"
}

variable "storage_versioning" {
  description = "Enable storage versioning"
  type        = bool
  default     = true
}

# VPC Connector
variable "vpc_connector_name" {
  description = "VPC connector name for Cloud Run"
  type        = string
  default     = "saleor-vpc-connector"
}