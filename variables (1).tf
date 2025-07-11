// variables.tf
variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "resource_groups" {
  description = "List of resource group names"
  type        = list(string)
  default     = ["virtinf-rg", "virtinf-rg2", "Bookmywhip-rg"]
}

variable "storage_accounts" {
  description = "Storage account definitions"
  type = list(object({
    name           = string
    resource_group = string
  }))
  default = [
    { name = "bookmywhipstorage2025", resource_group = "Bookmywhip-rg" },
    { name = "forddiag",               resource_group = "Bookmywhip-rg" }
  ]
}

variable "cosmos_account_name" {
  type        = string
  default     = "virtinf-cosmos"
}
variable "cosmos_resource_group" {
  type        = string
  default     = "virtinf-rg"
}

variable "eventhub_namespace_name" {
  type    = string
  default = "virtinf-hub"
}
variable "eventhub_name" {
  type    = string
  default = "virtinf-hub"
}
variable "eventhub_resource_group" {
  type    = string
  default = "virtinf-rg"
}

variable "cognitive_services" {
  description = "Map of Cognitive Services accounts to create"
  type = map(object({
    resource_group = string
    kind           = string
    sku_name       = string
  }))
  default = {
    aidiagexpert    = { resource_group = "Bookmywhip-rg", kind = "CognitiveServices", sku_name = "S0" }
    forddiagdocint1 = { resource_group = "Bookmywhip-rg", kind = "CognitiveServices", sku_name = "S0" }
    virtinfopenai   = { resource_group = "virtinf-rg",    kind = "CognitiveServices", sku_name = "S0" }
    virtinfspeech   = { resource_group = "virtinf-rg",    kind = "CognitiveServices", sku_name = "S0" }
  }
}

variable "key_vault_name" {
  type    = string
  default = "virtinf-kv"
}
variable "kv_resource_group" {
  type    = string
  default = "virtinf-rg"
}

variable "acr_name" {
  type    = string
  default = "virtinfacr"
}
variable "acr_resource_group" {
  type    = string
  default = "virtinf-rg"
}

variable "aks_name" {
  type    = string
  default = "virtinf-aks"
}
variable "aks_resource_group" {
  type    = string
  default = "virtinf-rg"
}
variable "aks_dns_prefix" {
  type    = string
  default = "virtinf"
}

variable "search_name" {
  type    = string
  default = "virtinf-search"
}
variable "search_resource_group" {
  type    = string
  default = "virtinf-rg"
}
