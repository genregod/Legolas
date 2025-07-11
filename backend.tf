# Add this block to one of your .tf files, e.g., main.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"         # The resource group you created
    storage_account_name = "mystateaccount12345" # Your globally unique storage account name
    container_name       = "tfstate"
    key                  = "legal_ai_platform.tfstate" # A unique key for this state file
  }
}
