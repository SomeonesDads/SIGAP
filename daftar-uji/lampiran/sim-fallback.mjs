// Usage: node daftar-uji/lampiran/sim-fallback.mjs <path-ke-frontend> <folder-output-sementara>
import { createRequire } from "module";
const ts = createRequire(process.argv[2] + "/package.json")("typescript");
import fs from "fs";
const root = process.argv[2];
const mon = fs.readFileSync(root + "/src/lib/monitoring.ts", "utf8");
const api = fs.readFileSync(root + "/src/lib/api.ts", "utf8");
const js = (s) => ts.transpileModule(s, { compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 } }).outputText;
const dir = process.argv[3];
fs.writeFileSync(dir + "/monitoring.mjs", js(mon).replace(/from "@\/lib\/([a-z]+)"/g, 'from "./$1.mjs"'));
fs.writeFileSync(dir + "/types.mjs", "export {}");
fs.writeFileSync(dir + "/api.mjs", js(api).replace(/from "@\/lib\/([a-z]+)"/g, 'from "./$1.mjs"'));
globalThis.fetch = async () => ({ ok: false, status: 502, json: async () => ({}) });
const { guessRegion, fetchMonitoringHotspots } = await import("file://" + dir + "/api.mjs");
const qs = ["Ada titik api di Pulang Pisau hari ini?", "Pantau karhutla di Riau", "Cek kebakaran di daerah medan kota", "Status api di Seruyan", "Berapa kerugian jika api di Ketapang dibiarkan?", "Halo SIGAP", "Kebakaran di Kabupaten Bogor"];
for (const q of qs) {
  const r = guessRegion(q);
  const d = await fetchMonitoringHotspots(r, 5);
  console.log(JSON.stringify({ q, region: r, source: d.source, is_live: d.is_live, total_raw: d.total_raw_hotspots, clusters: d.cluster_count, top: d.hotspots[0]?.id + " " + (d.hotspots[0]?.location ?? "-") }));
}
const all = await fetchMonitoringHotspots("Indonesia", 35);
console.log(JSON.stringify({ q: "(dashboard poll Indonesia)", source: all.source, is_live: all.is_live, clusters: all.cluster_count, ids: all.hotspots.map(h => h.id + ":" + h.severity + ":" + h.riskScore) }));

// Filter kriteria prioritas (logika monitor-dashboard.tsx) pada data sampel
const { SAMPLE_HOTSPOTS, rankHotspots } = await import("file://" + dir + "/monitoring.mjs");
const r = rankHotspots(SAMPLE_HOTSPOTS);
console.log("\nranked:", r.map(h=>h.id).join(","));
console.log("critical>=85:", r.filter(h=>h.riskScore>=85).map(h=>h.id).join(","));
console.log("peatland:", r.filter(h=>h.peatland).map(h=>h.id).join(","));
console.log("settlement<=3km:", r.filter(h=>h.settlementKm<=3).map(h=>h.id).join(","));
console.log("sev count:", JSON.stringify(r.reduce((a,h)=>(a[h.severity]=(a[h.severity]||0)+1,a),{})));
