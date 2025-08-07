#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { CosmosClient } from "@azure/cosmos";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { TextAnalyticsClient } from "@azure/ai-text-analytics";

class AzureMCPServer {
  private server: Server;
  private credential: DefaultAzureCredential;
  
  constructor() {
    this.server = new Server(
      {
        name: "azure-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.credential = new DefaultAzureCredential();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "azure_storage_list_blobs",
            description: "List blobs in an Azure Storage container",
            inputSchema: {
              type: "object",
              properties: {
                storageAccount: {
                  type: "string",
                  description: "Storage account name",
                },
                containerName: {
                  type: "string",
                  description: "Container name",
                },
              },
              required: ["storageAccount", "containerName"],
            },
          },
          {
            name: "azure_storage_upload_blob",
            description: "Upload a blob to Azure Storage",
            inputSchema: {
              type: "object",
              properties: {
                storageAccount: {
                  type: "string",
                  description: "Storage account name",
                },
                containerName: {
                  type: "string",
                  description: "Container name",
                },
                blobName: {
                  type: "string",
                  description: "Blob name",
                },
                content: {
                  type: "string",
                  description: "Blob content",
                },
              },
              required: ["storageAccount", "containerName", "blobName", "content"],
            },
          },
          {
            name: "azure_cosmos_query",
            description: "Query Azure Cosmos DB",
            inputSchema: {
              type: "object",
              properties: {
                endpoint: {
                  type: "string",
                  description: "Cosmos DB endpoint",
                },
                databaseName: {
                  type: "string",
                  description: "Database name",
                },
                containerName: {
                  type: "string",
                  description: "Container name",
                },
                query: {
                  type: "string",
                  description: "SQL query",
                },
              },
              required: ["endpoint", "databaseName", "containerName", "query"],
            },
          },
          {
            name: "azure_search_documents",
            description: "Search documents in Azure Cognitive Search",
            inputSchema: {
              type: "object",
              properties: {
                endpoint: {
                  type: "string",
                  description: "Search service endpoint",
                },
                indexName: {
                  type: "string",
                  description: "Search index name",
                },
                searchText: {
                  type: "string",
                  description: "Search query",
                },
                apiKey: {
                  type: "string",
                  description: "Search service API key",
                },
              },
              required: ["endpoint", "indexName", "searchText", "apiKey"],
            },
          },
          {
            name: "azure_text_analytics",
            description: "Analyze text with Azure Text Analytics",
            inputSchema: {
              type: "object",
              properties: {
                endpoint: {
                  type: "string",
                  description: "Text Analytics endpoint",
                },
                text: {
                  type: "string",
                  description: "Text to analyze",
                },
                operation: {
                  type: "string",
                  enum: ["sentiment", "entities", "keyPhrases", "language"],
                  description: "Analysis operation",
                },
                apiKey: {
                  type: "string",
                  description: "Text Analytics API key",
                },
              },
              required: ["endpoint", "text", "operation", "apiKey"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "azure_storage_list_blobs":
            return await this.listBlobs(args as any);
          case "azure_storage_upload_blob":
            return await this.uploadBlob(args as any);
          case "azure_cosmos_query":
            return await this.queryCosmosDB(args as any);
          case "azure_search_documents":
            return await this.searchDocuments(args as any);
          case "azure_text_analytics":
            return await this.analyzeText(args as any);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async listBlobs(args: { storageAccount: string; containerName: string }) {
    const blobServiceClient = new BlobServiceClient(
      `https://${args.storageAccount}.blob.core.windows.net`,
      this.credential
    );
    const containerClient = blobServiceClient.getContainerClient(args.containerName);
    
    const blobs: any[] = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
        contentType: blob.properties.contentType,
      });
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ blobs }, null, 2),
        },
      ],
    };
  }

  private async uploadBlob(args: { 
    storageAccount: string; 
    containerName: string; 
    blobName: string; 
    content: string 
  }) {
    const blobServiceClient = new BlobServiceClient(
      `https://${args.storageAccount}.blob.core.windows.net`,
      this.credential
    );
    const containerClient = blobServiceClient.getContainerClient(args.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(args.blobName);
    
    const uploadResponse = await blockBlobClient.upload(args.content, args.content.length);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            etag: uploadResponse.etag,
            lastModified: uploadResponse.lastModified,
          }, null, 2),
        },
      ],
    };
  }

  private async queryCosmosDB(args: { 
    endpoint: string; 
    databaseName: string; 
    containerName: string; 
    query: string 
  }) {
    const client = new CosmosClient({
      endpoint: args.endpoint,
      aadCredentials: this.credential,
    });
    
    const container = client.database(args.databaseName).container(args.containerName);
    const { resources } = await container.items.query(args.query).fetchAll();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ results: resources }, null, 2),
        },
      ],
    };
  }

  private async searchDocuments(args: { 
    endpoint: string; 
    indexName: string; 
    searchText: string; 
    apiKey: string 
  }) {
    const searchClient = new SearchClient(
      args.endpoint,
      args.indexName,
      new AzureKeyCredential(args.apiKey)
    );
    
    const searchResults = await searchClient.search(args.searchText);
    const results: any[] = [];
    
    for await (const result of searchResults.results) {
      results.push(result);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ results }, null, 2),
        },
      ],
    };
  }

  private async analyzeText(args: { 
    endpoint: string; 
    text: string; 
    operation: string; 
    apiKey: string 
  }) {
    const client = new TextAnalyticsClient(
      args.endpoint,
      new AzureKeyCredential(args.apiKey)
    );
    
    let result;
    const documents = [args.text];

    switch (args.operation) {
      case "sentiment":
        result = await client.analyzeSentiment(documents);
        break;
      case "entities":
        result = await client.recognizeEntities(documents);
        break;
      case "keyPhrases":
        result = await client.extractKeyPhrases(documents);
        break;
      case "language":
        result = await client.detectLanguage(documents);
        break;
      default:
        throw new Error(`Unknown operation: ${args.operation}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ result }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Azure MCP Server running on stdio");
  }
}

const server = new AzureMCPServer();
server.run().catch(console.error);
