import nextEnv from "@next/env";
import pg from "pg";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";

nextEnv.loadEnvConfig(process.cwd());
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});
const id = `connection-test-${randomUUID()}`;
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(
    'INSERT INTO "User" (id,email,name,"passwordHash") VALUES ($1,$2,$3,$4)',
    [id, `${id}@example.invalid`, "Connection test", "not-a-login-hash"],
  );
  const result = await client.query('SELECT role FROM "User" WHERE id=$1', [id]);
  assert.equal(result.rows[0].role, "STUDENT");
  await client.query("ROLLBACK");
  const after = await client.query('SELECT id FROM "User" WHERE id=$1', [id]);
  assert.equal(after.rowCount, 0);
  console.log("PASS: Neon insert/read, STUDENT default, rollback and no remaining test record");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("FAIL: database integration", error.code ?? error.name);
  process.exitCode = 1;
} finally {
  await client.end();
}
