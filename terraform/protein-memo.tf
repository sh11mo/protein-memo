resource "google_cloud_run_v2_service" "protein_memo" {
  name     = "protein-memo"
  location = "asia-northeast1"
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = data.google_service_account.cloud_run_sa.email

    annotations = {
      "deploy-timestamp" = timestamp()
    }

    vpc_access {
      network_interfaces {
        network    = data.google_compute_network.vpc.id
        subnetwork = data.google_compute_subnetwork.subnet.id
      }
      egress = "PRIVATE_RANGES_ONLY"
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [data.google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = var.protein_memo_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          memory = "512Mi"
        }
        cpu_idle = true
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "NODE_ENV"
        value = var.env
      }

      env {
        name  = "SOCKET_PATH"
        value = "/cloudsql/${data.google_sql_database_instance.main.connection_name}"
      }

      env {
        name  = "MYSQL_USER"
        value = var.db_user
      }

      env {
        name  = "MYSQL_DATABASE"
        value = "protein_memo"
      }

      env {
        name  = "MYSQL_PASSWORD"
        value = var.db_password
      }

      env {
        name = "LINE_CHANNEL_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.line_channel_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "LINE_CHANNEL_ACCESS_TOKEN"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.line_channel_access_token.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

resource "google_cloud_run_v2_service_iam_member" "protein_memo_public" {
  name     = google_cloud_run_v2_service.protein_memo.name
  location = google_cloud_run_v2_service.protein_memo.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_secret_manager_secret" "line_channel_secret" {
  secret_id = "line-channel-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "line_channel_access_token" {
  secret_id = "line-channel-access-token"
  replication {
    auto {}
  }
}
