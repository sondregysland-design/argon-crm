import cron from "node-cron";
import { runBrregSync } from "./tasks";

export function startScheduler() {
  console.log("[Scheduler] Starting cron jobs...");

  // Brønnøysund sync — Monday 3AM
  cron.schedule("0 3 * * 1", () => {
    console.log("[Scheduler] Running brreg_sync");
    runBrregSync();
  });

  console.log("[Scheduler] Cron jobs registered.");
}
