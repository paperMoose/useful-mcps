import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import { z } from 'zod';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define Zod schemas for responses
const ToolSchema = z.object({
  name: z.string(),
  description: z.string().optional()
});

const ToolsListSchema = z.object({
  tools: z.array(ToolSchema).optional()
});

const ContentItemSchema = z.object({
  type: z.string(),
  text: z.string().optional()
});

const ToolResponseSchema = z.object({
  content: z.array(ContentItemSchema).optional()
});

async function main() {
  try {
    console.log('PostgreSQL MCP Client');
    console.log('====================');

    // Get MCP server path from environment or use default
    const serverPath = process.env.MCP_SERVER_PATH || '../postgres-cli-mcp/psql-mcp.js';
    
    // Resolve the server path properly
    // For relative paths in .env, resolve from the current working directory
    let absoluteServerPath;
    if (serverPath.startsWith('/')) {
      // Absolute path
      absoluteServerPath = serverPath;
    } else {
      // Relative path - resolve relative to the project root (not src folder)
      absoluteServerPath = join(process.cwd(), serverPath);
    }
    
    console.log(`Looking for MCP server at: ${absoluteServerPath}`);
    
    // Check if server file exists
    if (!fs.existsSync(absoluteServerPath)) {
      console.error(`Error: MCP server file not found at ${absoluteServerPath}`);
      process.exit(1);
    }
    
    console.log(`Connecting to MCP server at: ${absoluteServerPath}`);

    // Environment variables for PostgreSQL
    const env = {
      PGHOST: process.env.PGHOST || 'localhost',
      PGPORT: process.env.PGPORT || '5433',
      PGUSER: process.env.PGUSER || 'postgres',
      PGDATABASE: process.env.PGDATABASE || 'evals',
      PGPASSWORD: process.env.PGPASSWORD || 'postgres'
    };

    // Create transport for MCP client
    const transport = new StdioClientTransport({
      command: 'node',
      args: [absoluteServerPath],
      env: { ...process.env, ...env }
    });

    // Create MCP client
    const client = new Client(
      { 
        name: "postgres-mcp-client",
        version: "1.0.0" 
      }
    );
    
    console.log('Connecting to MCP server...');
    await client.connect(transport);
    console.log('Connected successfully!');

    // List available tools
    const toolsResponse = await client.request(
      { method: "tools/list" },
      ToolsListSchema
    );
    
    console.log("\nAvailable tools:");
    
    if (toolsResponse.tools && toolsResponse.tools.length > 0) {
      toolsResponse.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description || 'No description'}`);
      });
    } else {
      console.log("No tools available or unable to retrieve tools list");
    }

    // Create readline interface for interactive CLI
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Run interactive loop
    await interactiveLoop(client, rl);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function interactiveLoop(client, rl) {
  console.log('\nCommands:');
  console.log('- list: List all tables');
  console.log('- describe <table>: Describe table schema');
  console.log('- query <sql>: Execute SQL query');
  console.log('- callrecords [limit]: Get call records');
  console.log('- exit: Quit the application');
  console.log('');

  function prompt() {
    rl.question('> ', async (input) => {
      if (input.trim().toLowerCase() === 'exit') {
        console.log('Goodbye!');
        rl.close();
        process.exit(0);
        return;
      }

      try {
        const parts = input.trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch (command) {
          case 'list':
            await listTables(client);
            break;
          case 'describe':
            if (!args[0]) {
              console.log('Error: Missing table name');
              break;
            }
            await describeTable(client, args[0]);
            break;
          case 'query':
            if (args.length === 0) {
              console.log('Error: Missing SQL query');
              break;
            }
            await executeQuery(client, args.join(' '));
            break;
          case 'callrecords':
            const limit = args[0] ? parseInt(args[0]) : 5;
            await getCallRecords(client, limit);
            break;
          default:
            console.log(`Unknown command: ${command}`);
        }
      } catch (error) {
        console.error('Error executing command:', error);
      }

      prompt();
    });
  }

  prompt();
}

async function listTables(client) {
  console.log('\nListing tables...');
  try {
    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: "listTables",
          arguments: {}
        }
      },
      ToolResponseSchema
    );
    
    console.log('\nTables:');
    console.log(formatToolResult(result));
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

async function describeTable(client, tableName) {
  console.log(`\nDescribing table: ${tableName}`);
  try {
    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: "describeTable",
          arguments: { tableName }
        }
      },
      ToolResponseSchema
    );
    
    console.log(`\nSchema for ${tableName}:`);
    console.log(formatToolResult(result));
  } catch (error) {
    console.error(`Error describing table ${tableName}:`, error);
  }
}

async function executeQuery(client, query) {
  console.log(`\nExecuting query: ${query}`);
  try {
    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: "queryDatabase",
          arguments: { query }
        }
      },
      ToolResponseSchema
    );
    
    console.log('\nQuery result:');
    console.log(formatToolResult(result));
  } catch (error) {
    console.error('Error executing query:', error);
  }
}

async function getCallRecords(client, limit) {
  console.log(`\nGetting call records (limit: ${limit})...`);
  try {
    // Use a more limited query to avoid buffer overflow
    const result = await client.request(
      {
        method: "tools/call",
        params: {
          name: "queryDatabase",
          arguments: { 
            query: `
              SELECT id, client_id, date, call_minutes
              FROM call_records 
              ORDER BY id
              LIMIT ${limit}
            `
          }
        }
      },
      ToolResponseSchema
    );
    
    console.log('\nCall records (limited fields):');
    console.log(formatToolResult(result));
  } catch (error) {
    console.error('Error getting call records:', error);
  }
}

function formatToolResult(result) {
  if (!result) return 'No result returned';
  
  if (result.content) {
    return result.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
  }
  
  return JSON.stringify(result, null, 2);
}

main().catch(console.error); 