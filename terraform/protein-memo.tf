resource "google_cloud_run_service" "protein_memo" {
  name     = "protein-memo"
  location = "asia-northeast1"

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "all"
    }
  }

  template {
    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances"   = data.google_sql_database_instance.main.connection_name
        "run.googleapis.com/vpc-access-connector" = data.google_vpc_access_connector.connector.id
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
      }
    }

    spec {
      service_account_name = data.google_service_account.cloud_run_sa.email

      containers {
        image = var.protein_memo_image

        ports {
          container_port = 8080
        }

        resources {
          limits = {
            memory = "512Mi"
          }
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
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.line_channel_secret.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "LINE_CHANNEL_ACCESS_TOKEN"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.line_channel_access_token.secret_id
              key  = "latest"
            }
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_member" "protein_memo_public" {
  service  = google_cloud_run_service.protein_memo.name
  location = google_cloud_run_service.protein_memo.location
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
