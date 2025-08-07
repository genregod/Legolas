# Azure MCP Tools

A comprehensive Model Context Protocol (MCP) server for Azure services, enabling AI assistants to interact with various Azure resources.

## Features

This MCP server provides tools for:

- **Azure Storage**: List and upload blobs
- **Azure Cosmos DB**: Query documents and containers
- **Azure Cognitive Search**: Search indexed documents
- **Azure OpenAI**: Chat completions and AI interactions
- **Azure Text Analytics**: Sentiment analysis, entity recognition, key phrase extraction

## Prerequisites

- Node.js 18+ 
- Azure CLI
- Azure Developer CLI (azd)
- An Azure subscription
- Azure resources (Storage Account, Cosmos DB, etc.)

## Installation

1. **Install Azure CLI** (if not already installed):
   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Install Azure Developer CLI** (already installed):
   ```bash
   curl -fsSL https://aka.ms/install-azd.sh | bash
   ```

3. **Build the MCP server**:
   ```bash
   cd mcp
   npm run build
   ```

## Setup

1. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.template .env
   # Edit .env with your Azure resource details
   ```

3. **Authenticate with Azure**:
   ```bash
   az login
   azd auth login
   ```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "azure": {
      "command": "node",
      "args": ["/workspaces/Legolas/mcp/dist/azure-mcp-server.js"],
      "env": {
        "AZURE_CLIENT_ID": "your_client_id",
        "AZURE_CLIENT_SECRET": "your_client_secret", 
        "AZURE_TENANT_ID": "your_tenant_id"
      }
    }
  }
}
```

### Available Tools

#### 1. Azure Storage - List Blobs
```json
{
  "name": "azure_storage_list_blobs",
  "arguments": {
    "storageAccount": "mystorageaccount",
    "containerName": "mycontainer"
  }
}
```

#### 2. Azure Storage - Upload Blob
```json
{
  "name": "azure_storage_upload_blob",
  "arguments": {
    "storageAccount": "mystorageaccount",
    "containerName": "mycontainer",
    "blobName": "myfile.txt",
    "content": "Hello, Azure!"
  }
}
```

#### 3. Azure Cosmos DB - Query
```json
{
  "name": "azure_cosmos_query",
  "arguments": {
    "endpoint": "https://mycosmosdb.documents.azure.com:443/",
    "databaseName": "mydatabase",
    "containerName": "mycontainer",
    "query": "SELECT * FROM c WHERE c.status = 'active'"
  }
}
```

#### 4. Azure Search - Search Documents
```json
{
  "name": "azure_search_documents",
  "arguments": {
    "endpoint": "https://mysearch.search.windows.net",
    "indexName": "myindex",
    "searchText": "legal documents",
    "apiKey": "your_search_api_key"
  }
}
```

#### 5. Azure OpenAI - Chat
```json
{
  "name": "azure_openai_chat",
  "arguments": {
    "endpoint": "https://myopenai.openai.azure.com",
    "deploymentName": "gpt-4",
    "messages": [
      {"role": "user", "content": "Hello, Azure OpenAI!"}
    ],
    "apiKey": "your_openai_api_key"
  }
}
```

#### 6. Azure Text Analytics
```json
{
  "name": "azure_text_analytics",
  "arguments": {
    "endpoint": "https://mytextanalytics.cognitiveservices.azure.com",
    "text": "I love using Azure services!",
    "operation": "sentiment",
    "apiKey": "your_text_analytics_api_key"
  }
}
```

## Azure Developer CLI (azd) Usage

### Initialize a new project
```bash
azd init
```

### Provision Azure resources
```bash
azd provision
```

### Deploy application
```bash
azd deploy
```

### Monitor resources
```bash
azd monitor
```

### Clean up resources
```bash
azd down
```

## Authentication

The MCP server supports multiple authentication methods:

1. **Default Azure Credential** (recommended for development)
2. **Service Principal** (recommended for production)
3. **Managed Identity** (for Azure-hosted applications)

### Environment Variables

Create a `.env` file with your Azure credentials:

```bash
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_tenant_id
```

## Integration with Your Legal AI App

This MCP server can enhance your legal AI application by providing:

1. **Document Storage**: Store legal documents in Azure Blob Storage
2. **Document Search**: Index and search legal documents using Azure Cognitive Search
3. **AI Analysis**: Use Azure OpenAI for document analysis and generation
4. **Text Processing**: Extract entities and analyze sentiment in legal texts
5. **Data Storage**: Store case data and metadata in Cosmos DB

### Example Workflow

1. Upload legal documents to Azure Storage
2. Index documents in Azure Cognitive Search
3. Use Azure OpenAI to analyze and generate legal content
4. Store case metadata in Cosmos DB
5. Use Text Analytics for entity extraction and sentiment analysis

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure Azure credentials are properly set
2. **Resource Not Found**: Verify Azure resource names and endpoints
3. **Permission Denied**: Check Azure RBAC permissions

### Debug Mode

Set environment variable for debug logging:
```bash
export DEBUG=azure-mcp-server
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
