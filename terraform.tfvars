# terraform.tfvars


subscription_id         = "Azure subscription 1"
location                = "eastus"


resource_groups = [
  "virtinf-rg",
  "virtinf-rg2",
  "Bookmywhip-rg",
]


storage_accounts = [
  {
    name           = "bookmywhipstorage2025"
    resource_group = "Bookmywhip-rg"
  },
  {
    name           = "forddiag"
    resource_group = "Bookmywhip-rg"
  },
]


cosmos_account_name    = "virtinf-cosmos"
cosmos_resource_group  = "virtinf-rg"


eventhub_namespace_name    = "virtinf-hub"
eventhub_name              = "virtinf-hub"
eventhub_resource_group    = "virtinf-rg"


cognitive_services = {
  aidiagexpert    = { resource_group = "Bookmywhip-rg", kind = "CognitiveServices", sku_name = "S0" }
  forddiagdocint1 = { resource_group = "Bookmywhip-rg", kind = "CognitiveServices", sku_name = "S0" }
  virtinfopenai   = { resource_group = "virtinf-rg",    kind = "CognitiveServices", sku_name = "S0" }
  virtinfspeech   = { resource_group = "virtinf-rg",    kind = "CognitiveServices", sku_name = "S0" }
}


key_vault_name       = "virtinf-kv"
kv_resource_group    = "virtinf-rg"


acr_name             = "virtinfacr"
acr_resource_group   = "virtinf-rg"


aks_name             = "virtinf-aks"
aks_resource_group   = "virtinf-rg"
aks_dns_prefix       = "virtinf"


search_name          = "virtinf-search"
search_resource_group = "virtinf-rg"