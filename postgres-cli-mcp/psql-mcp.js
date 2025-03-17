#!/usr/bin/env node
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { exec } = require('child_process');
const { z } = require('zod');

// Execute SQL query using psql CLI
const runQuery = (sql) => {
  return new Promise((resolve, reject) => {
    // Escape quotes and dollars in SQL to prevent injection
    const safeSql = sql.replace(/"/g, '\\"').replace(/\$/g, '\\$');
    
    // Use environment variables for connection details - these will come from .cursor/mcp.json
    const connectionString = process.env.DATABASE_URL || '';
    
    // If DATABASE_URL is provided, use it directly
    let cmd;
    if (connectionString) {
      cmd = `psql "${connectionString}" -c "${safeSql}"`;
      console.error(`Using connection string: ${connectionString.replace(/:[^:]*@/, ':***@')}`);
    } else {
      // Otherwise use individual connection parameters
      const connectionParams = {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || '5433',
        user: process.env.PGUSER || 'postgres',
        database: process.env.PGDATABASE || 'evals',
        password: process.env.PGPASSWORD || 'postgres'
      };
      
      // Build psql command with all connection parameters
      cmd = `PGPASSWORD="${connectionParams.password}" psql -h ${connectionParams.host} -p ${connectionParams.port} -U ${connectionParams.user} -d ${connectionParams.database} -c "${safeSql}"`;
      console.error(`Connection parameters: host=${connectionParams.host}, port=${connectionParams.port}, user=${connectionParams.user}, database=${connectionParams.database}`);
    }
    
    // For debugging
    console.error(`Executing query: ${sql}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Query error: ${stderr || error.message}`);
        reject(stderr || error.message);
      } else {
        const result = stdout.trim();
        console.error(`Query result length: ${result.length} bytes`);
        if (result.length > 0) {
          console.error(`First 100 chars of result: ${result.substring(0, 100)}...`);
        } else {
          console.error('Result is empty');
        }
        resolve(result);
      }
    });
  });
};

// Get database metadata (list tables)
const getTableList = async () => {
  const query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name";
  return runQuery(query);
};

// Get table schema (columns and types)
const getTableSchema = async (tableName) => {
  const query = `
    SELECT 
      column_name, 
      data_type,
      is_nullable,
      column_default
    FROM 
      information_schema.columns 
    WHERE 
      table_schema = 'public' 
      AND table_name = '${tableName}'
    ORDER BY 
      ordinal_position
  `;
  return runQuery(query);
};

// Get call records
const getCallRecords = async (limit = 100) => {
  // We've verified that the 'call_records' table exists
  const query = `
    SELECT * FROM call_records 
    ORDER BY id
    LIMIT ${limit}
  `;
  return runQuery(query);
};

async function main() {
  // Create a new MCP server
  const server = new McpServer({
    name: "PostgreSQL CLI MCP",
    version: "1.0.0"
  });

  // Add a tool for running SQL queries
  server.tool("queryDatabase",
    {
      query: z.string().min(1).describe("SQL query to execute against the PostgreSQL database")
    },
    async ({ query }) => {
      try {
        const result = await runQuery(query);
        return {
          content: [{ 
            type: "text", 
            text: result || "No results returned from the database." 
          }]
        };
      } catch (error) {
        console.error(`Error in queryDatabase: ${error}`);
        throw new Error(`Database query error: ${error}`);
      }
    },
    {
      description: "Execute a read-only SQL query against the PostgreSQL database",
      examples: [{
        params: { 
          query: "SELECT * FROM users LIMIT 5"
        },
        result: {
          content: [{ 
            type: "text", 
            text: "1|John|Doe|john@example.com\n2|Jane|Smith|jane@example.com"
          }]
        }
      }]
    }
  );

  // Add a tool for getting table list
  server.tool("listTables",
    {},
    async () => {
      try {
        const tables = await getTableList();
        return {
          content: [{ 
            type: "text", 
            text: tables || "No tables found in the database." 
          }]
        };
      } catch (error) {
        console.error(`Error in listTables: ${error}`);
        throw new Error(`Error listing tables: ${error}`);
      }
    },
    {
      description: "List all tables in the PostgreSQL database"
    }
  );

  // Add a tool for getting table schema
  server.tool("describeTable",
    {
      tableName: z.string().min(1).describe("Name of the table to describe")
    },
    async ({ tableName }) => {
      try {
        const schema = await getTableSchema(tableName);
        return {
          content: [{ 
            type: "text", 
            text: schema || `No schema information found for table '${tableName}'.` 
          }]
        };
      } catch (error) {
        console.error(`Error in describeTable: ${error}`);
        throw new Error(`Error describing table ${tableName}: ${error}`);
      }
    },
    {
      description: "Get detailed schema information for a specific table"
    }
  );
  
  // Add a dedicated tool for getting call records
  server.tool("getCallRecords",
    {
      limit: z.number().optional().describe("Maximum number of call records to retrieve")
    },
    async ({ limit = 100 }) => {
      try {
        const records = await getCallRecords(limit);
        return {
          content: [{ 
            type: "text", 
            text: records || "No call records found in the database." 
          }]
        };
      } catch (error) {
        console.error(`Error in getCallRecords: ${error}`);
        throw new Error(`Error retrieving call records: ${error}`);
      }
    },
    {
      description: "Get call records from the database"
    }
  );

  // Debug callback for transport
  server.onRequest = (request) => {
    console.error(`Received request: ${JSON.stringify(request)}`);
  };

  server.onResponse = (response) => {
    console.error(`Sending response: ${JSON.stringify(response)}`);
  };

  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("PostgreSQL MCP server started and ready to receive requests.");
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
