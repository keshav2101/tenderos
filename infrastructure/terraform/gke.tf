# Google Kubernetes Engine (GKE) Autopilot Cluster definition
resource "google_container_cluster" "gke_autopilot" {
  name     = "tenderos-gke-cluster-${var.environment}"
  location = var.region

  enable_autopilot = true
  network          = google_compute_network.vpc.id
  subnetwork       = google_compute_subnetwork.subnet.id

  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  release_channel {
    channel = "REGULAR"
  }

  deletion_protection = false

  resource_labels = {
    env = var.environment
    app = "tenderos"
  }
}
