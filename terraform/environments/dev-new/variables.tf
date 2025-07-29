variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "saleor-platform-dev"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-southeast2"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "asia-southeast2-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Networking variables
variable "vpc_name" {
  description = "VPC network name"
  type        = string
  default     = "saleor-vpc-dev"
}

variable "subnet_name" {
  description = "Subnet name"
  type        = string
  default     = "saleor-subnet-dev"
}

variable "pod_range_name" {
  description = "Pod IP range name"
  type        = string
  default     = "pod-range-dev"
}

variable "svc_range_name" {
  description = "Service IP range name"
  type        = string
  default     = "svc-range-dev"
}

# GKE variables
variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
  default     = "saleor-gke-dev"
}

variable "node_count" {
  description = "Number of nodes in the cluster"
  type        = number
  default     = 2
}

variable "machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "e2-medium"
}

variable "disk_size_gb" {
  description = "Disk size for GKE nodes"
  type        = number
  default     = 30
}

variable "preemptible" {
  description = "Use preemptible instances"
  type        = bool
  default     = true
}

variable "auto_upgrade" {
  description = "Enable auto upgrade"
  type        = bool
  default     = true
}

variable "auto_repair" {
  description = "Enable auto repair"
  type        = bool
  default     = true
}

# Cloud SQL variables
variable "database_name" {
  description = "Database instance name"
  type        = string
  default     = "saleor-db-dev"
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "database_tier" {
  description = "Database tier"
  type        = string
  default     = "db-f1-micro"
}

variable "database_disk_size" {
  description = "Database disk size in GB"
  type        = number
  default     = 20
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
  default     = "saleor-redis-dev"
}

variable "redis_tier" {
  description = "Redis tier"
  type        = string
  default     = "BASIC"
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

# Storage variables
variable "media_bucket_name" {
  description = "Media bucket name"
  type        = string
  default     = "saleor-media-dev"
}

variable "static_bucket_name" {
  description = "Static files bucket name"
  type        = string
  default     = "saleor-static-dev"
}

variable "storage_class" {
  description = "Storage class"
  type        = string
  default     = "STANDARD"
}

variable "storage_versioning" {
  description = "Enable storage versioning"
  type        = bool
  default     = false
}