output "database_connection_name" {
  description = "Connection name for Cloud SQL instance"
  value       = module.cloudsql.connection_name
}

output "database_private_ip" {
  description = "Private IP address of the Cloud SQL instance"
  value       = module.cloudsql.private_ip_address
}

output "database_name" {
  description = "Database name"
  value       = module.cloudsql.database_name
}

output "database_user" {
  description = "Database user"
  value       = module.cloudsql.database_user
}

output "password_secret_name" {
  description = "Secret Manager secret name for database password"
  value       = module.cloudsql.password_secret_name
}

output "redis_host" {
  description = "Redis instance host"
  value       = module.redis.redis_host
}

output "redis_port" {
  description = "Redis instance port"
  value       = module.redis.redis_port
}

output "redis_url" {
  description = "Redis connection URL"
  value       = module.redis.redis_url
}

output "vpc_name" {
  description = "Name of the VPC"
  value       = module.networking.vpc_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = module.networking.subnet_name
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr_block
}

output "cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "cluster_location" {
  description = "GKE cluster location"
  value       = module.gke.cluster_location
}

output "endpoint" {
  description = "GKE cluster endpoint"
  value       = module.gke.endpoint
  sensitive   = true
}

output "ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = module.gke.ca_certificate
  sensitive   = true
}

output "media_bucket_name" {
  description = "Media bucket name"
  value       = module.storage.media_bucket_name
}

output "media_bucket_url" {
  description = "Media bucket URL"
  value       = module.storage.media_bucket_url
}

output "static_bucket_name" {
  description = "Static bucket name"
  value       = module.storage.static_bucket_name
}

output "static_bucket_url" {
  description = "Static bucket URL"
  value       = module.storage.static_bucket_url
}