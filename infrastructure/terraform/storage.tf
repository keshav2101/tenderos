# Cloud Storage Buckets (production alternative for MinIO)

resource "google_storage_bucket" "documents" {
  name          = "tenderos-documents-${var.project_id}-${var.environment}"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

resource "google_storage_bucket" "profiles" {
  name          = "tenderos-profiles-${var.project_id}-${var.environment}"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true
}
