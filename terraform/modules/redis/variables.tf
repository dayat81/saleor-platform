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

variable "redis_name" {
  description = "Redis instance name"
  type        = string
}

variable "redis_tier" {
  description = "Redis tier"
  type        = string
  default     = "BASIC"
}

variable "memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

variable "vpc_id" {
  description = "VPC network ID"
  type        = string
}