Absolutely! Writing a simple custom MCP server that leverages the PostgreSQL CLI (`psql`) is straightforward and offers precise control for your workflow. Here's exactly how to set it up:

---

## ✅ **Replace Cursor Rule with a Custom MCP Server using `psql`:**

You'll write a small script that wraps `psql` and communicates using the MCP protocol.

**Step-by-step guide:**

---

### **Step 1: Create your MCP Server**

Create a new directory, e.g., `~/mcp-servers/postgres-cli-mcp`.

Inside this directory, create a Node.js file named `index.js`:

```js
#!/usr/bin/env node
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const runQuery = (sql) => {
  return new Promise((resolve, reject) => {
    const command = `psql "${process.env.DATABASE_URL}" -t -A -c "${sql.replace(/"/g, '\\"')}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) reject(stderr);
      else resolve(stdout.trim());
    });
  });
};

rl.on('line', async (line) => {
  const request = JSON.parse(line);
  const { id, params } = request;

  if (request.method === 'queryDatabase') {
    const { query } = params;
    try {
      const result = await runQuery(query);
      const response = { id, result: result.trim() };
      console.log(JSON.stringify(response));
    } catch (error) {
      console.log(JSON.stringify({ id, error: error.message }));
    }
  } else {
    const response = { id, error: 'Unknown method' };
    console.log(JSON.stringify(response));
  }
});
```

- Save the file as `psql-mcp.js`.
- Install Node.js dependencies (no external dependencies required).

```bash
chmod +x index.js
```

---

## **Step 2: MCP Configuration in Cursor**

Create or update your MCP config file at:

`~/.cursor/mcp.json` or `<project-root>/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "psql-cli": {
      "command": "node",
      "args": ["/path/to/mcp-servers/psql-mcp.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5433/mydb"
      }
    }
  }
}
```

- Set your own `DATABASE_URL` (or any environment variables required).

---

## **Step 3: Test your Custom MCP Server:**

Run your MCP server standalone first to ensure it’s working properly.

- In a terminal, run:
```bash
echo '{"id":1,"method":"queryDatabase","params":{"query":"SELECT 1"}}' | ./psql-mcp.js
```

You should see output from your PostgreSQL server confirming proper responses.

---

## **Step 4: Integrate & Verify in Cursor:**

- Restart Cursor to pick up the MCP configuration.
- Open Cursor’s MCP settings; you should see your server (`postgres-db`) listed.
- Try queries directly in Cursor prompts like:

> **Prompt:** `"Using queryDatabase method, run 'SELECT * FROM users LIMIT 5;'"`

The agent will utilize your MCP integration seamlessly.

---

## 🧠 **Benefits of this MCP approach:**

- **Full flexibility:** Run custom SQL queries via agent interactions.
- **Simple debugging:** If queries fail, you can debug the Node script directly.
- **Minimal overhead:** Lightweight, transparent execution via existing Postgres CLI (`psql`).

---

## 🚨 **Important Best Practices:**

- **Security:** Sanitize and validate inputs carefully to avoid SQL injection or unintended queries.
- **Limit Access:** For sensitive databases, consider read-only credentials or limited query permissions.
- **Clear Descriptions:** If you expand this MCP tool, clearly document methods and parameters for accurate agent use.

---

## ⚙️ **Recommended Workflow Transition:**

- Start by testing your custom MCP alongside your existing Cursor rule.
- Once stable, **remove the Cursor rule entirely**, relying exclusively on your MCP for DB interactions.

---

## 🟢 **Final Recommendation:**

Yes, **replace your Cursor rule with this custom MCP**, leveraging the simplicity and power of PostgreSQL CLI (`psql`) integration to enhance your Cursor-based AI agent workflows effectively.