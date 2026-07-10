# PostgreSQL database resource configurations

resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "tenderos-postgres-${var.environment}"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = "db-custom-2-7680" # 2 vCPUs, 7.5GB RAM

    ip_configuration {
      ipv4_enabled = true
      
      # Authorize the Cloud NAT IP or let GKE connect using Cloud SQL Auth Proxy
      # In GKE, we will run the Cloud SQL Auth Proxy sidecar container or use IAM db auth.
      # That is the most secure enterprise-grade way to connect to Cloud SQL!
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
  password = random_password.db_password.result
}
