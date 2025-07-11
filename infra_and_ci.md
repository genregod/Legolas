// main.tf
terraform {
  required_version = ">= 1.1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

data "azurerm_client_config" "current" {}

// Existing resource groups, services, etc.
// ... (same as previous main.tf content) ...

// variables.tf
variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "eastus"
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "resource_groups" {
  description = "List of resource groups"
  type        = list(string)
  default     = ["virtinf-rg", "virtinf-rg2", "Bookmywhip-rg"]
}

// outputs.tf
output "storage_endpoints" {
  description = "Blob endpoints for storage accounts"
  value = {
    bookmywhip = azurerm_storage_account.bookmywhipstorage.primary_blob_endpoint
    forddiag   = azurerm_storage_account.forddiag.primary_blob_endpoint
  }
}

output "cosmosdb_uri" {
  description = "Cosmos DB URI"
  value       = azurerm_cosmosdb_account.virtinf_cosmos.endpoint
}

output "eventhub_connection" {
  description = "Event Hub namespace default connection string"
  value       = azurerm_eventhub_namespace.virtinf_hub.default_primary_connection_string
}

output "cognitive_services_keys" {
  description = "Cognitive Services account keys"
  value = {
    aidiagexpert      = azurerm_cognitive_account.aidiagexpert.primary_access_key
    forddiagdocint1   = azurerm_cognitive_account.forddiagdocint1.primary_access_key
    virtinfopenai     = azurerm_cognitive_account.virtinfopenai.primary_access_key
  }
}

// azure-pipelines.yml
# Trigger pipeline on push to main
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  TF_ROOT: '.'
  TF_PLAN: 'tfplan'

stages:
  - stage: Terraform_Init_Plan
    displayName: 'Terraform Init & Plan'
    jobs:
      - job: InitPlan
        steps:
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '3.x'
          - script: |
              curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
              sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
              sudo apt-get update && sudo apt-get install terraform -y
            displayName: 'Install Terraform'
          - task: AzureCLI@2
            inputs:
              azureSubscription: 'Azure subscription 1'
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                cd $(TF_ROOT)
                terraform init -input=false -backend-config="subscription_id=$(subscription_id)"
                terraform plan -out=$(TF_PLAN) -input=false

  - stage: Terraform_Apply
    displayName: 'Terraform Apply'
    dependsOn: Terraform_Init_Plan
    condition: eq(variables['Build.Reason'], 'Manual')
    jobs:
      - job: Apply
        steps:
          - task: AzureCLI@2
            inputs:
              azureSubscription: 'Azure subscription 1'
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                cd $(TF_ROOT)
                terraform apply -input=false "$(TF_PLAN)"

