import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getPool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
const pool = getPool();

for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
  await pool.execute(statement);
  console.log("OK:", statement.slice(0, 60));
}

await pool.end();
console.log("Migration complete.");
