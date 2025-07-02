resource "google_redis_instance" "cache" {
  name           = var.redis_name
  tier           = var.redis_tier
  memory_size_gb = var.memory_size_gb
  region         = var.region

  authorized_network = var.vpc_id

  redis_version     = "REDIS_6_X"
  display_name      = "Saleor Redis Cache - ${var.environment}"
  
  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }

  lifecycle {
    prevent_destroy = false
  }
}