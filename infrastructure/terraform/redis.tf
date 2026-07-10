# Memorystore Redis Instance
resource "google_redis_instance" "redis" {
  name               = "tenderos-redis-${var.environment}"
  tier               = "BASIC"
  memory_size_gb     = 2
  region             = var.region
  authorized_network = google_compute_network.vpc.id

  redis_version = "REDIS_7_0"
  display_name  = "TenderOS Cache/Limiter Redis"
}
