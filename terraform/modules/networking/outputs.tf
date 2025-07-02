output "vpc_name" {
  description = "Name of the VPC"
  value       = google_compute_network.vpc_network.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = google_compute_network.vpc_network.id
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = google_compute_subnetwork.subnet.name
}

output "subnet_id" {
  description = "ID of the subnet"
  value       = google_compute_subnetwork.subnet.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = google_compute_subnetwork.subnet.ip_cidr_range
}

output "private_vpc_connection" {
  description = "Private VPC connection for Cloud SQL"
  value       = google_service_networking_connection.private_vpc_connection
}