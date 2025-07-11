// main.tf

# Terraform configuration block
terraform {
  required_version = ">=1.1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">=3.0.0"
    }
  }
  # The backend block is intentionally omitted here, as it's assumed to be in backend.tf
}

# Provider configuration
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# Data source to get current Azure client configuration (e.g., tenant_id, object_id)
data "azurerm_client_config" "current" {}

# Resources that EXIST and will be READ (using 'data' blocks)

# 1. Existing Resource Groups
data "azurerm_resource_group" "rg" {
  for_each = toset(var.resource_groups)
  name     = each.value
}

# 2. Existing Storage Accounts
data "azurerm_storage_account" "storage" {
  for_each            = { for acct in var.storage_accounts : acct.name => acct }
  name                = each.value.name
  resource_group_name = each.value.resource_group
}

# 3. Existing Cosmos DB Account
data "azurerm_cosmosdb_account" "cosmos" {
  name                = var.cosmos_account_name
  resource_group_name = var.cosmos_resource_group
}

# 4. Existing Event Hub Namespace + Hub
data "azurerm_eventhub_namespace" "ehns" {
  name                = var.eventhub_namespace_name
  resource_group_name = var.eventhub_resource_group
}

data "azurerm_eventhub" "eh" {
  name                = var.eventhub_name
  namespace_name      = data.azurerm_eventhub_namespace.ehns.name
  resource_group_name = var.eventhub_resource_group
}

# Data source for the default authorization rule of the existing Event Hub
# This is needed to get the primary_connection_string for Event Hub instance
data "azurerm_eventhub_authorization_rule" "eh_default_rule" {
  name                = "RootManageSharedAccessKey"
  resource_group_name = var.eventhub_resource_group
  namespace_name      = data.azurerm_eventhub_namespace.ehns.name
  eventhub_name       = data.azurerm_eventhub.eh.name
}


# 5. Existing Cognitive Services Accounts
data "azurerm_cognitive_account" "cog" {
  for_each            = var.cognitive_services
  name                = each.key
  resource_group_name = each.value.resource_group
}

# 6. Existing Azure Key Vault
data "azurerm_key_vault" "kv" {
  name                = var.key_vault_name
  resource_group_name = var.kv_resource_group
}

# 7. Existing Azure Container Registry
data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = var.acr_resource_group
}


# 8. AKS Cluster (CHANGED BACK TO DATA BLOCK as it now exists)
data "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_name
  resource_group_name = var.aks_resource_group
}

# 9. Cognitive Search (CHANGED BACK TO DATA BLOCK as it now exists)
data "azurerm_search_service" "search" {
  name                = var.search_name
  resource_group_name = var.search_resource_group
}
