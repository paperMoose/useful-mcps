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