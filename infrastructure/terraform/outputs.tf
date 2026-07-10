output "project_id" {
  value = var.project_id
}

output "gke_cluster_name" {
  value = google_container_cluster.gke_autopilot.name
}

output "gke_cluster_endpoint" {
  value = google_container_cluster.gke_autopilot.endpoint
}

output "postgres_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "redis_host" {
  value = google_redis_instance.redis.host
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.tenderos_repo.repository_id}"
}
