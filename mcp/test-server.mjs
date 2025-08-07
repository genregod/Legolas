#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testMCPServer() {
  console.log('🧪 Testing Azure MCP Server...');
  
  try {
    // Test if the server can start and list tools
    const { stdout, stderr } = await execAsync(
      'echo \'{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}\' | node dist/azure-mcp-server.js',
      { cwd: '/workspaces/Legolas/mcp', timeout: 5000 }
    );
    
    console.log('✅ MCP Server responded successfully');
    console.log('📋 Available tools:');
    
    const response = JSON.parse(stdout);
    if (response.result && response.result.tools) {
      response.result.tools.forEach((tool, index) => {
        console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing MCP server:', error.message);
    process.exit(1);
  }
}

testMCPServer();
