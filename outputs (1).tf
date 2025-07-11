// outputs.tf
output "storage_accounts" {
  description = "Primary connection strings for storage accounts"
  value = {
    for acct in data.azurerm_storage_account.storage :
    acct.name => acct.primary_connection_string
  }
  sensitive = true
}

output "cosmos_endpoint" {
  description = "Cosmos DB URI"
  value       = data.azurerm_cosmosdb_account.cosmos.endpoint
}

output "eventhub_connection_strings" {
  description = "Event Hub connection strings"
  value = {
    namespace = data.azurerm_eventhub_namespace.ehns.default_primary_connection_string
    hub       = data.azurerm_eventhub_authorization_rule.eh_default_rule.primary_connection_string
  }
  sensitive = true
}

output "cognitive_service_keys" {
  description = "Keys and endpoints for each Cognitive Services account"
  value = {
    for name, svc in data.azurerm_cognitive_account.cog :
    name => {
      key1    = svc.primary_access_key
      key2    = svc.secondary_access_key
      endpoint = svc.endpoint
    }
  }
  sensitive = true
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = data.azurerm_key_vault.kv.vault_uri
}

output "acr_login_server" {
  description = "ACR login server"
  value       = data.azurerm_container_registry.acr.login_server
}

output "aks_kube_config" {
  description = "AKS kubeconfig file (base64)"
  value       = data.azurerm_kubernetes_cluster.aks.kube_config_raw # CORRECTED: References the AKS data source
  sensitive   = true
}

output "search_endpoint" {
  description = "Cognitive Search endpoint"
  value       = "https://${data.azurerm_search_service.search.name}.search.windows.net" # CORRECTED: References the Search data source
}
