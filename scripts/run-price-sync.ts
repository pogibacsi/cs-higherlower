import { mockPriceProvider } from "../src/lib/price-sync/mock-provider";
import { runPriceSync } from "../src/lib/price-sync/run";
import { steamPriceProvider } from "../src/lib/price-sync/steam-provider";

const provider = process.argv.includes("--steam")
  ? steamPriceProvider
  : mockPriceProvider;

runPriceSync(provider)
  .then((run) => {
    console.log(
      `Price sync ${run.status}: ${run.successCount} success, ${run.failCount} failed.`
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
