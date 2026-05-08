terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "asia-northeast1"
}

# 既存リソースを参照
data "google_sql_database_instance" "main" {
  name = "orange-db"
}

data "google_service_account" "cloud_run_sa" {
  account_id = "cloud-run-sa"
}

data "google_vpc_access_connector" "connector" {
  name = "cloudrun-connector"
}

