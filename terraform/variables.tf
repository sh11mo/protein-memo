variable "project_id" {
  type        = string
  description = "GCP project ID (e.g. orange-prod01)"
}

variable "env" {
  type        = string
  description = "Environment name (e.g. prod, dev)"
}

variable "db_user" {
  type        = string
  description = "Cloud SQL user"
  default     = "omochy"
}

variable "db_password" {
  type        = string
  description = "Cloud SQL password"
  sensitive   = true
}

variable "protein_memo_image" {
  type        = string
  description = "Docker image for protein-memo"
}
