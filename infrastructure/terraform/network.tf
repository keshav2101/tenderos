# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "tenderos-vpc-${var.environment}"
  auto_create_subnetworks = false
}

# Subnet for GKE Autopilot
resource "google_compute_subnetwork" "subnet" {
  name          = "tenderos-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "gke-pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "gke-services"
    ip_cidr_range = "10.2.0.0/20"
  }
}

# Cloud Router (needed for Cloud NAT)
resource "google_compute_router" "router" {
  name    = "tenderos-router-${var.environment}"
  region  = var.region
  network = google_compute_network.vpc.id
}

# Cloud NAT (provides internet access for GKE pods without public IPs)
resource "google_compute_router_nat" "nat" {
  name                               = "tenderos-nat-${var.environment}"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Firewall rule to allow traffic inside the VPC
resource "google_compute_firewall" "allow_internal" {
  name    = "tenderos-allow-internal-${var.environment}"
  network = google_compute_network.vpc.name

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = ["10.0.0.0/8"]
}
