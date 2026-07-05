# Google Kubernetes Engine (GKE) Autopilot Cluster definition
resource "google_container_cluster" "gke_autopilot" {
  name     = "tenderos-gke-cluster-${var.environment}"
  location = var.region

  enable_autopilot = true

  ip_allocation_policy {
    use_ip_aliases = true
  }

  release_channel {
    channel = "REGULAR"
  }

  deletion_protection = false

  labels = {
    env = var.environment
    app = "tenderos"
  }
}

output "kubernetes_cluster_name" {
  value       = google_container_cluster.gke_autopilot.name
  description = "GKE Cluster Name"
}

output "kubernetes_cluster_endpoint" {
  value       = google_container_cluster.gke_autopilot.endpoint
  description = "GKE Cluster Endpoint"
}
