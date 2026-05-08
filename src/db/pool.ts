import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

export function getPool(): mysql.Pool {
  if (!pool) {
    const socketPath = process.env.SOCKET_PATH;
    const base = {
      user: process.env.MYSQL_USER ?? "protein",
      password: process.env.MYSQL_PASSWORD ?? "protein_pass",
      database: process.env.MYSQL_DATABASE ?? "protein_memo",
      timezone: "+09:00",
    };
    pool = mysql.createPool(
      socketPath
        ? { ...base, socketPath }
        : { ...base, host: process.env.MYSQL_HOST ?? "127.0.0.1", port: Number(process.env.MYSQL_PORT ?? 3306) }
    );
  }
  return pool;
}
