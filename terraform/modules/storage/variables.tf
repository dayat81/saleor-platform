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

variable "media_bucket" {
  description = "Media bucket name"
  type        = string
}

variable "static_bucket" {
  description = "Static files bucket name"
  type        = string
}

variable "storage_class" {
  description = "Storage class"
  type        = string
  default     = "STANDARD"
}

variable "versioning" {
  description = "Enable storage versioning"
  type        = bool
  default     = false
}