# PostgreSQL and Redis cloud resources provisioning configurations

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "tenderos-postgres-${var.environment}"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = "db-custom-2-7680" # 2 vCPUs, 7.5GB RAM

    ip_configuration {
      ipv4_enabled    = true
      private_network = null # For local testing; in full production bind to custom VPC
    }

    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "tenderos_db" {
  name     = "tenderos"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "tenderos_user" {
  name     = "tenderos"
  instance = google_sql_database_instance.postgres.name
  password = "tenderos_prod_secure_password_change_me"
}

# Memorystore Redis Instance
resource "google_redis_instance" "redis" {
  name               = "tenderos-redis-${var.environment}"
  tier               = "BASIC"
  memory_size_gb     = 2
  region             = var.region
  authorized_network = null

  redis_version = "REDIS_7_0"
  display_name  = "TenderOS Cache/Limiter Redis"
}

output "postgres_instance_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "redis_host" {
  value = google_redis_instance.redis.host
}
