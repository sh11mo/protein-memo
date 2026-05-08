import { getPool } from "./pool.js";

function jstDateString(offsetDays = 0): string {
  const d = new Date();
  d.setTime(d.getTime() + (9 * 60 + offsetDays * 24 * 60) * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

export async function getGoal(userId: string): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.execute<any[]>(
    "SELECT daily_goal_grams FROM user_settings WHERE line_user_id = ?",
    [userId]
  );
  return rows[0]?.daily_goal_grams ?? 100;
}

export async function setGoal(userId: string, grams: number): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO user_settings (line_user_id, daily_goal_grams)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE daily_goal_grams = VALUES(daily_goal_grams)`,
    [userId, grams]
  );
}

export async function addProtein(
  userId: string,
  grams: number
): Promise<number> {
  const pool = getPool();
  const date = jstDateString();
  await pool.execute(
    `INSERT INTO protein_log (line_user_id, log_date, total_grams)
     VALUES (?, ?, GREATEST(0, ?))
     ON DUPLICATE KEY UPDATE total_grams = GREATEST(0, total_grams + ?)`,
    [userId, date, grams, grams]
  );
  const [rows] = await pool.execute<any[]>(
    "SELECT total_grams FROM protein_log WHERE line_user_id = ? AND log_date = ?",
    [userId, date]
  );
  return rows[0]?.total_grams ?? 0;
}

export async function getTotal(
  userId: string,
  offsetDays = 0
): Promise<number> {
  const pool = getPool();
  const date = jstDateString(offsetDays);
  const [rows] = await pool.execute<any[]>(
    "SELECT total_grams FROM protein_log WHERE line_user_id = ? AND log_date = ?",
    [userId, date]
  );
  return rows[0]?.total_grams ?? 0;
}
