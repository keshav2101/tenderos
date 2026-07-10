variable "project_id" {
  type        = string
  description = "GCP Project ID"
  default     = "tender-ai-501123"
}

variable "region" {
  type        = string
  description = "GCP Region"
  default     = "asia-south1"
}

variable "zone" {
  type        = string
  description = "GCP Zone"
  default     = "asia-south1-a"
}

variable "environment" {
  type        = string
  description = "Deployment Environment"
  default     = "production"
}

variable "dns_zone_name" {
  type        = string
  description = "Cloud DNS Zone Name"
  default     = "tenderos-in"
}

variable "dns_domain" {
  type        = string
  description = "Production Domain Name"
  default     = "tenderos.in"
}
