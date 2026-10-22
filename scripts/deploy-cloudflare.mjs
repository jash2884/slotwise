// Deploys the built Worker to your own Cloudflare account (no ChatGPT hosting).
// Usage: npm run build && node scripts/deploy-cloudflare.mjs
// Env: CF_WORKER_NAME, CF_D1_NAME, CF_D1_ID, CF_DOMAIN (e.g. slotwise.jashparmar.com)
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const need = (k) => { const v = process.env[k]; if (!v) { console.error(`Missing ${k}`); process.exit(1); } return v; };
const name = need("CF_WORKER_NAME"), dbName = need("CF_D1_NAME"), dbId = need("CF_D1_ID"), domain = need("CF_DOMAIN");

const config = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
config.name = name;
config.d1_databases = (config.d1_databases ?? []).map((d) => ({ ...d, database_name: dbName, database_id: dbId }));
config.routes = [{ pattern: domain, custom_domain: true }];
config.workers_dev = false;
delete config.services;
writeFileSync("dist/server/wrangler.deploy.json", JSON.stringify(config, null, 2));

const result = spawnSync("node", ["./node_modules/wrangler/bin/wrangler.js", "deploy", "--config", "dist/server/wrangler.deploy.json"], { stdio: "inherit" });
process.exit(result.status ?? 1);
