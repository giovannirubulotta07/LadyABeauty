import { timingSafeEqual } from "node:crypto";
import { env } from "@/server/env";
import { runScheduledTasks } from "@/server/jobs/tasks";

export const maxDuration = 60;

function authorised(request: Request): boolean {
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Scheduled tasks (reminders, retention). Called every 5 minutes by Supabase
 * pg_cron (POST) and once a day by Vercel Cron as a fallback (GET).
 */
async function handle(request: Request) {
  if (!authorised(request))
    return new Response("Unauthorized", { status: 401 });
  try {
    return Response.json(await runScheduledTasks(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("cron/taches", error);
    return Response.json({ error: "failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
