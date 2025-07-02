variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "database_name" {
  description = "Database instance name"
  type        = string
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

variable "disk_size" {
  description = "Database disk size in GB"
  type        = number
  default     = 20
}

variable "backup_enabled" {
  description = "Enable database backups"
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "Database backup start time"
  type        = string
  default     = "03:00"
}

variable "authorized_networks" {
  description = "Authorized networks CIDR"
  type        = string
}

variable "vpc_id" {
  description = "VPC network ID"
  type        = string
}

variable "private_vpc_connection" {
  description = "Private VPC connection dependency"
  type        = any
}