# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "tenderos_repo" {
  location      = var.region
  repository_id = "tenderos"
  description   = "Docker repository for TenderOS microservices"
  format        = "DOCKER"

  docker_config {
    immutable_tags = false
  }
}
