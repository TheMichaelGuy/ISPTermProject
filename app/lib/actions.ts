"use server";

import sql from "./db";

export async function saveBlastResult(result: any) {
  await sql`
    INSERT INTO blast_results (rid, program, database, query, hits)
    VALUES (${result.rid}, ${result.program}, ${result.database}, ${result.query}, ${JSON.stringify(result.hits)})
  `;
}