# Reserve a Global static external IP for the Ingress Load Balancer
resource "google_compute_global_address" "ingress_ip" {
  name = "tenderos-global-static-ip"
}

output "load_balancer_ip" {
  value       = google_compute_global_address.ingress_ip.address
  description = "Global IP allocated for Ingress"
}
