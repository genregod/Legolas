#!/bin/bash

# Azure MCP Tools Setup Script
echo "🚀 Setting up Azure MCP Tools..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Installing..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
else
    echo "✅ Azure CLI is already installed"
fi

# Check if azd is installed
if ! command -v azd &> /dev/null; then
    echo "❌ Azure Developer CLI not found. It should have been installed earlier."
    exit 1
else
    echo "✅ Azure Developer CLI is installed"
fi

# Login to Azure (this will open browser)
echo "🔐 Please login to Azure..."
az login

# Get subscription information
echo "📋 Getting Azure subscription information..."
az account show

# Set up environment variables template
echo "📝 Creating environment template..."
cat > .env.template << EOF
# Azure Authentication
AZURE_SUBSCRIPTION_ID=your_subscription_id_here
AZURE_CLIENT_ID=your_client_id_here
AZURE_CLIENT_SECRET=your_client_secret_here
AZURE_TENANT_ID=your_tenant_id_here

# Azure Resources
AZURE_STORAGE_ACCOUNT=your_storage_account_here
AZURE_COSMOS_ENDPOINT=your_cosmos_endpoint_here
AZURE_SEARCH_ENDPOINT=your_search_endpoint_here
AZURE_SEARCH_API_KEY=your_search_api_key_here
AZURE_OPENAI_ENDPOINT=your_openai_endpoint_here
AZURE_OPENAI_API_KEY=your_openai_api_key_here
AZURE_TEXT_ANALYTICS_ENDPOINT=your_text_analytics_endpoint_here
AZURE_TEXT_ANALYTICS_API_KEY=your_text_analytics_api_key_here
EOF

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.template to .env and fill in your Azure resource details"
echo "2. Create Azure resources using 'azd' or Azure portal"
echo "3. Configure your MCP client to use the Azure MCP server"
echo ""
echo "Example azd commands:"
echo "  azd init                    # Initialize a new project"
echo "  azd provision               # Provision Azure resources"
echo "  azd deploy                  # Deploy your application"
echo ""
echo "MCP Server location: /workspaces/Legolas/mcp/dist/azure-mcp-server.js"
