terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
  }

  backend "s3" {
    endpoint                    = "sgp1.digitaloceanspaces.com"
    region                      = "us-east-1" # Doesn't matter for DO Spaces
    key                         = "terraform/sip.tfstate"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Variables
variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "sip"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "sgp1"
}

variable "environment" {
  description = "Environment (dev, staging, production)"
  type        = string
  default     = "production"
}

# VPC
resource "digitalocean_vpc" "main" {
  name     = "${var.project_name}-vpc"
  region   = var.region
  ip_range = "10.10.0.0/16"

  description = "VPC for ${var.project_name}"
}

# Database
resource "digitalocean_database_cluster" "postgres" {
  name       = "${var.project_name}-postgres"
  engine     = "pg"
  version    = "16"
  size       = "db-s-2vcpu-4gb"
  region     = var.region
  node_count = 1

  private_network_uuid = digitalocean_vpc.main.id

  tags = [var.project_name, var.environment]
}

resource "digitalocean_database_db" "main" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "sip_db"
}

resource "digitalocean_database_user" "app" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "sip_app"
}

# Redis
resource "digitalocean_database_cluster" "redis" {
  name       = "${var.project_name}-redis"
  engine     = "redis"
  version    = "7"
  size       = "db-s-1vcpu-1gb"
  region     = var.region
  node_count = 1

  private_network_uuid = digitalocean_vpc.main.id

  tags = [var.project_name, var.environment]
}

# Spaces (Object Storage)
resource "digitalocean_spaces_bucket" "assets" {
  name   = "${var.project_name}-assets"
  region = var.region

  acl = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# App Platform - API Service
resource "digitalocean_app" "api" {
  spec {
    name   = "${var.project_name}-api"
    region = var.region

    database {
      name       = digitalocean_database_cluster.postgres.name
      engine     = "PG"
      production = true
      cluster_name = digitalocean_database_cluster.postgres.name
    }

    service {
      name               = "api"
      instance_count     = 2
      instance_size_slug = "professional-xs"

      github {
        repo           = "your-org/sip"
        branch         = "main"
        deploy_on_push = true
      }

      dockerfile_path = "apps/api-service/Dockerfile"

      http_port = 3001

      health_check {
        http_path = "/api/v1/health"
      }

      env {
        key   = "DATABASE_URL"
        value = digitalocean_database_cluster.postgres.uri
        scope = "RUN_TIME"
      }

      env {
        key   = "REDIS_HOST"
        value = digitalocean_database_cluster.redis.host
        scope = "RUN_TIME"
      }

      env {
        key   = "NODE_ENV"
        value = "production"
        scope = "RUN_TIME"
      }

      env {
        key   = "JWT_SECRET"
        value = var.jwt_secret
        scope = "RUN_TIME"
        type  = "SECRET"
      }

      env {
        key   = "S3_ENDPOINT"
        value = "https://${var.region}.digitaloceanspaces.com"
        scope = "RUN_TIME"
      }

      env {
        key   = "S3_BUCKET"
        value = digitalocean_spaces_bucket.assets.name
        scope = "RUN_TIME"
      }
    }
  }
}

# App Platform - Web App
resource "digitalocean_app" "web" {
  spec {
    name   = "${var.project_name}-web"
    region = var.region

    static_site {
      name              = "web"
      build_command     = "npm run build"
      output_dir        = ".next"

      github {
        repo           = "your-org/sip"
        branch         = "main"
        deploy_on_push = true
      }

      dockerfile_path = "apps/web-app/Dockerfile"

      env {
        key   = "NEXT_PUBLIC_API_URL"
        value = "${digitalocean_app.api.live_url}/api/v1"
        scope = "BUILD_TIME"
      }
    }
  }
}

# Outputs
output "database_uri" {
  value     = digitalocean_database_cluster.postgres.uri
  sensitive = true
}

output "redis_uri" {
  value     = digitalocean_database_cluster.redis.uri
  sensitive = true
}

output "api_url" {
  value = digitalocean_app.api.live_url
}

output "web_url" {
  value = digitalocean_app.web.live_url
}

output "spaces_bucket" {
  value = digitalocean_spaces_bucket.assets.name
}
