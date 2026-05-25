type PriceSyncRun = {
  status: string;
  successCount: number;
  failCount: number;
};

function baseUrl() {
  return (process.env.CF_PREVIEW_URL ?? "http://localhost:8787").replace(/\/$/, "");
}

const provider = process.argv.includes("--steam") ? "steam" : "mock";

const response = await fetch(
  `${baseUrl()}/api/admin/price-sync/run?provider=${provider}`,
  { method: "POST" }
);
const text = await response.text();

if (!response.ok) {
  throw new Error(`Price sync request failed: ${response.status} ${text}`);
}

const run = JSON.parse(text) as PriceSyncRun;
console.log(
  `Price sync ${run.status}: ${run.successCount} success, ${run.failCount} failed.`
);

export {};
