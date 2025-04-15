import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Input schema definition (raw shape)
const inputSchema = {
  timezone: z.string().optional().describe("Optional timezone string (e.g., 'America/New_York', 'Europe/London'). Defaults to 'America/Los_Angeles'.")
};

// Output schema is implicitly defined by the return type of the callback

async function main() {
  const transport = new StdioServerTransport();

  const server = new Server({
    name: "datetime-mcp",
    version: "1.0.0",
    description: "A simple MCP that provides the current date and time, optionally for a specific timezone."
  });

  // Define and register the 'getCurrentDateTime' tool
  server.tool(
    'getCurrentDateTime',      // 1. Tool name
    "Returns the current date and time, defaulting to America/Los_Angeles. Optionally accepts a 'timezone' argument (e.g., 'Europe/London') to format the time for that zone.", // 2. Description
    inputSchema,               // 3. Input schema definition
    async (input) => {         // 4. Callback accepts input
      const now = new Date();
      let targetTimezone = input.timezone || 'America/Los_Angeles'; // Default to LA time
      let dateTimeString;
      let suffix = `(Timezone: ${targetTimezone})`;

      try {
        const formatter = new Intl.DateTimeFormat('sv-SE', { 
          timeZone: targetTimezone,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false
        });
        dateTimeString = formatter.format(now);
      } catch (error) {
        // Handle invalid timezone string - fall back to UTC and add warning
        targetTimezone = 'UTC'; // Explicitly state fallback
        dateTimeString = now.toISOString(); 
        suffix = `(Invalid timezone provided: ${input.timezone}. Falling back to UTC)`;
      }
      
      return { content: [{ type: "text", text: `${dateTimeString} ${suffix}` }] }; 
    }
  );

  try {
    await server.connect(transport);
    // console.log('DateTime MCP Server ready and listening via stdio.');
  } catch (error) {
    console.error('Failed to start DateTime MCP Server:', error);
    process.exit(1);
  }
}

main(); 