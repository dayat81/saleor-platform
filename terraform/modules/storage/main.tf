resource "google_storage_bucket" "media_bucket" {
  name          = var.media_bucket
  location      = var.region
  storage_class = var.storage_class
  
  uniform_bucket_level_access = true

  versioning {
    enabled = var.versioning
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket" "static_bucket" {
  name          = var.static_bucket
  location      = var.region
  storage_class = var.storage_class
  
  uniform_bucket_level_access = true

  versioning {
    enabled = var.versioning
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket_iam_member" "media_bucket_public_read" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "static_bucket_public_read" {
  bucket = google_storage_bucket.static_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_service_account" "storage_admin" {
  account_id   = "storage-admin-${var.environment}"
  display_name = "Storage Admin Service Account"
}

resource "google_storage_bucket_iam_member" "media_bucket_admin" {
  bucket = google_storage_bucket.media_bucket.name
  role   = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.storage_admin.email}"
}