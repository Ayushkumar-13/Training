# Terraform Configuration for Cloud Infrastructure (Azure AKS & Managed PostgreSQL)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "location" {
  type    = string
  default = "East US"
}

variable "resource_group_name" {
  type    = string
  default = "medstore-cloud-rg"
}

variable "aks_cluster_name" {
  type    = string
  default = "medstore-aks-cluster"
}

variable "pg_admin_password" {
  type      = string
  sensitive = true
  default   = "MedStoreP@ssword2026!"
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

# Azure Kubernetes Service (AKS) Cluster
resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_cluster_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "medstore-k8s"

  default_node_pool {
    name       = "default"
    node_count = 2
    vm_size    = "Standard_B2s"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Assessment-Production"
    Application = "MedStore"
  }
}

# Azure Database for PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "pg" {
  name                   = "medstore-pg-server"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  version                = "15"
  administrator_login    = "postgres"
  administrator_password = var.pg_admin_password
  storage_mb             = 32768
  sku_name               = "B_Standard_B1ms"
}

resource "azurerm_postgresql_flexible_server_database" "pg_db" {
  name      = "medstore"
  server_id = azurerm_postgresql_flexible_server.pg.id
  collate   = "en_US.utf8"
  charset   = "utf8"
}

output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "kube_config_raw" {
  value     = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive = true
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.pg.fqdn
}
