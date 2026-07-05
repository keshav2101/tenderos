# Terraform main configuration file for GCP
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

variable "project_id" {
  type        = string
  description = "GCP Project ID"
  default     = "tenderos-enterprise"
}

variable "region" {
  type    = string
  default = "asia-south1" # Mumbai region for low latency in India
}

variable "zone" {
  type    = string
  default = "asia-south1-a"
}

variable "environment" {
  type    = string
  default = "production"
}
