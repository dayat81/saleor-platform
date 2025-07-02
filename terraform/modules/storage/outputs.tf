output "media_bucket_name" {
  description = "Media bucket name"
  value       = google_storage_bucket.media_bucket.name
}

output "media_bucket_url" {
  description = "Media bucket URL"
  value       = google_storage_bucket.media_bucket.url
}

output "static_bucket_name" {
  description = "Static bucket name"
  value       = google_storage_bucket.static_bucket.name
}

output "static_bucket_url" {
  description = "Static bucket URL"
  value       = google_storage_bucket.static_bucket.url
}

output "storage_service_account_email" {
  description = "Storage service account email"
  value       = google_service_account.storage_admin.email
}