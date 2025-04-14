import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer as Server } from '@modelcontextprotocol/sdk/server/mcp.js';
// Define the schema for the tool's response
// const DateTimeResponseSchema = z.object({
//   currentDateTime: z.string().describe("The current date and time in ISO format.")
// });
async function main() {
    // Create the server transport using standard input/output
    const transport = new StdioServerTransport();
    // Create the MCP server instance with basic info
    const server = new Server({
        name: "datetime-mcp",
        version: "1.0.0",
        description: "A simple MCP that provides the current date and time."
    });
    // Define and register the 'getCurrentDateTime' tool
    server.tool('getCurrentDateTime', 'Returns the current date and time in ISO format.', async () => {
        // Tool implementation
        const now = new Date();
        const dateTimeString = now.toISOString();
        // Return value must match the expected content structure
        return { content: [{ type: "text", text: dateTimeString }] };
    });
    try {
        // Start the server by connecting it to the transport
        await server.connect(transport);
        // console.log('DateTime MCP Server ready and listening via stdio.');
    }
    catch (error) {
        console.error('Failed to start DateTime MCP Server:', error);
        process.exit(1);
    }
}
// Run the main function
main();
