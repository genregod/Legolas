#!/usr/bin/env node

/**
 * Azure MCP Server Usage Examples
 * 
 * This script demonstrates how to use the Azure MCP server with various Azure services.
 * Before running these examples, make sure you have:
 * 1. Azure resources provisioned
 * 2. Proper authentication configured
 * 3. Environment variables set
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

class AzureMCPClient {
  constructor() {
    this.requestId = 1;
  }

  async callTool(toolName, args) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      const child = spawn('node', ['dist/azure-mcp-server.js'], {
        cwd: '/workspaces/Legolas/mcp',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const response = JSON.parse(stdout);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });

      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();
    });
  }

  async listTools() {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "tools/list",
        params: {}
      };

      const child = spawn('node', ['dist/azure-mcp-server.js'], {
        cwd: '/workspaces/Legolas/mcp',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const response = JSON.parse(stdout);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });

      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();
    });
  }
}

async function runExamples() {
  console.log('🔧 Azure MCP Server Usage Examples');
  console.log('====================================\n');

  const client = new AzureMCPClient();

  try {
    // List available tools
    console.log('📋 Available Tools:');
    const toolsResponse = await client.listTools();
    if (toolsResponse.result && toolsResponse.result.tools) {
      toolsResponse.result.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name}`);
        console.log(`     ${tool.description}`);
      });
    }
    console.log();

    // Example usage instructions
    console.log('📚 Usage Examples:');
    console.log('==================\n');

    console.log('1. List Storage Blobs:');
    console.log('   Replace YOUR_STORAGE_ACCOUNT and YOUR_CONTAINER with actual values');
    console.log('   Example: mystorageaccount, documents\n');

    console.log('2. Upload a Blob:');
    console.log('   Uploads content to Azure Storage');
    console.log('   Example: Upload "Hello World" to test.txt\n');

    console.log('3. Query Cosmos DB:');
    console.log('   Execute SQL queries against Cosmos DB');
    console.log('   Example: SELECT * FROM c WHERE c.status = "active"\n');

    console.log('4. Search Documents:');
    console.log('   Search indexed documents in Azure Cognitive Search');
    console.log('   Example: Search for "legal contracts"\n');

    console.log('5. Analyze Text:');
    console.log('   Perform sentiment analysis, entity recognition, etc.');
    console.log('   Example: Analyze sentiment of "I love Azure services!"\n');

    console.log('🚀 To use these tools, configure your Azure resources and authentication first!');
    console.log('📖 See README.md for detailed setup instructions.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runExamples();
