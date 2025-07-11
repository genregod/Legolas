// outputs.tf
output "storage_accounts" {
  description = "Primary connection strings for storage accounts"
  value = {
    for acct in azurerm_storage_account.storage :
    acct.name => acct.primary_connection_string
  }
}


output "cosmos_endpoint" {
  description = "Cosmos DB URI"
  value       = azurerm_cosmosdb_account.cosmos.endpoint
}


output "eventhub_connection_strings" {
  description = "Event Hub connection strings"
  value = {
    namespace = azurerm_eventhub_namespace.ehns.default_primary_connection_string
    hub       = azurerm_eventhub.eh.default_primary_connection_string
  }
}


output "cognitive_service_keys" {
  description = "Keys for each Cognitive Services account"
  value = {
    for name, svc in azurerm_cognitive_account.cog :
    name => {
      key1 = svc.primary_access_key
      key2 = svc.secondary_access_key
    }
  }
}


output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.kv.vault_uri
}


output "acr_login_server" {
  description = "ACR login server"
  value       = azurerm_container_registry.acr.login_server
}


output "aks_kube_config" {
  description = "AKS kubeconfig file (base64)"
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
}


output "search_endpoint" {
  description = "Cognitive Search endpoint"
  value       = azurerm_search_service.search.primary_endpoint
}