/** Local helper: runs the scheduled tasks once. Usage: npm run cron */
process.loadEnvFile(".env.local");
const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const res = await fetch(`${base}/api/cron/taches`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
});
console.log(res.status, await res.text());
