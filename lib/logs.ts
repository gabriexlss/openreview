import { neon } from "@neondatabase/serverless";

export async function addLog(repoFullName: string, prNumber: number, status: string, message?: string) {
  if (!process.env.DATABASE_URL) return null;
  const sql = neon(process.env.DATABASE_URL);
  try {
    const result = await sql`
      INSERT INTO webhook_logs (repo_full_name, pr_number, status, message)
      VALUES (${repoFullName}, ${prNumber}, ${status}, ${message || null})
      RETURNING id
    `;
    return result[0].id;
  } catch (error) {
    console.error("Error adding log:", error);
    return null;
  }
}

export async function updateLog(id: number, status: string, message?: string) {
  if (!process.env.DATABASE_URL) return;
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`
      UPDATE webhook_logs
      SET status = ${status}, message = ${message || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error("Error updating log:", error);
  }
}

export async function getLogs() {
  if (!process.env.DATABASE_URL) return [];
  const sql = neon(process.env.DATABASE_URL);
  try {
    const rows = await sql`
      SELECT id, repo_full_name, pr_number, status, message, created_at, updated_at
      FROM webhook_logs
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return rows;
  } catch (error) {
    console.error("Error getting logs:", error);
    return [];
  }
}
