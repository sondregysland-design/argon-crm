import cron from "node-cron";
import { runBrregSync, runGoogleEnrich } from "./tasks";

export function startScheduler() {
  console.log("[Scheduler] Starting cron jobs...");

  // Brønnøysund sync — Monday 3AM
  cron.schedule("0 3 * * 1", () => {
    console.log("[Scheduler] Running brreg_sync");
    runBrregSync();
  });

  // Google Places enrichment — Wednesday 3AM
  cron.schedule("0 3 * * 3", () => {
    console.log("[Scheduler] Running google_enrich");
    runGoogleEnrich();
  });

  console.log("[Scheduler] Cron jobs registered.");
}
