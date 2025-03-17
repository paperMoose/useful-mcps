# PostgreSQL CLI MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with PostgreSQL databases using the `psql` CLI.

## Features

- Execute SQL queries against a PostgreSQL database
- List all tables in the database
- Get schema information for specific tables
- Uses environment variables for flexible configuration

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure PostgreSQL connection in your Cursor MCP configuration file:
   
   In `.cursor/mcp.json` (either in your home directory or project root):

   ```json
   {
     "mcpServers": {
       "postgres-cli": {
         "command": "node",
         "args": ["/path/to/postgres-cli-mcp/psql-mcp.js"],
         "env": {
           "PGHOST": "localhost",
           "PGPORT": "5433",
           "PGUSER": "postgres",
           "PGDATABASE": "mydatabase",
           "PGPASSWORD": "your_password"
         }
       }
     }
   }
   ```

## Running the Server

For development and testing, you can run the server directly:

```bash
npm start
```

## Available Tools

### queryDatabase

Execute a SQL query against the PostgreSQL database.

**Parameters:**
- `query`: SQL query to execute (string)

**Example:**
```
Using queryDatabase tool, run "SELECT * FROM users LIMIT 5"
```

### listTables

List all tables in the PostgreSQL database.

**Example:**
```
Using listTables tool, show me all tables in the database
```

### describeTable

Get detailed schema information for a specific table.

**Parameters:**
- `tableName`: Name of the table to describe (string)

**Example:**
```
Using describeTable tool, show me the schema for the "users" table
```

## Security Considerations

- This MCP server executes SQL queries directly, so it's recommended to use a read-only database user.
- Avoid exposing sensitive database credentials in the MCP configuration.
- The server includes basic SQL injection protection, but complex queries may require additional validation.

## Requirements

- Node.js 14.x or higher
- PostgreSQL client (`psql`) installed and accessible in PATH
- Access to a PostgreSQL database 