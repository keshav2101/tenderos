# Cloud DNS Managed Zone
resource "google_dns_managed_zone" "prod_zone" {
  name        = var.dns_zone_name
  dns_name    = "${var.dns_domain}."
  description = "TenderOS Production Managed DNS Zone"
  visibility  = "public"
}

# A record pointing the root domain to the global load balancer IP
resource "google_dns_record_set" "root" {
  name         = google_dns_managed_zone.prod_zone.dns_name
  managed_zone = google_dns_managed_zone.prod_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.ingress_ip.address]
}

# Wildcard A record pointing to the global load balancer IP (handles subdomains)
resource "google_dns_record_set" "wildcard" {
  name         = "*.${google_dns_managed_zone.prod_zone.dns_name}"
  managed_zone = google_dns_managed_zone.prod_zone.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.ingress_ip.address]
}
