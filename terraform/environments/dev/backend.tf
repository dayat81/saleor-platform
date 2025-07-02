terraform {
  backend "gcs" {
    bucket = "saleor-terraform-state-dev"
    prefix = "dev/terraform.tfstate"
  }
}