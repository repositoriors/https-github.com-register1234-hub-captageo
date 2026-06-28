const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const fail = [];

function exists(rel) {
  if (!fs.existsSync(path.join(root, rel))) fail.push(`Missing required file: ${rel}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertNoPattern(rel, pattern, label) {
  const text = read(rel);
  if (pattern.test(text)) fail.push(`${rel} exposes ${label}`);
}

function maxCoordDecimals(geojson) {
  let max = 0;
  for (const feature of geojson.features || []) {
    const coords = feature.geometry && feature.geometry.coordinates;
    if (!Array.isArray(coords)) continue;
    for (const value of coords) {
      const text = String(value);
      const decimals = text.includes(".") ? text.split(".")[1].length : 0;
      max = Math.max(max, decimals);
    }
  }
  return max;
}

const requiredFiles = [
  "index.html",
  "atlas/index.html",
  "apresentacao/seguro-agricola-capta.html",
  "apresentacao/zarc-milho-2-safra-pr.html",
  "evidencias/contexto-territorial/layer_atlas.html",
  "evidencias/carteira-exposta/layer_atlas.html",
  "evidencias/irrigacao-cristalina/layer_atlas.html",
  "evidencias/irrigacao-cristalina/data/visual_review_targets.geojson",
];

for (const file of requiredFiles) exists(file);

const forbiddenPublicPattern =
  /decisions_visual_reviewed|calibrated_score|ndvi_mean|ndwi_mean|ndmi_mean|temporal_stability|field_id|reviewer|api[_-]?key|secret|password|senha|threshold|limiar|peso|formula|fórmula|PUBLIC_REVIEW_CARD|HUMAN_REVIEW|NO_EFFECTIVE_IRRIGATION_SIGNAL|CONTROL_NEGATIVE/iu;

const publicFiles = [
  "atlas/index.html",
  "evidencias/irrigacao-cristalina/index.html",
  "evidencias/irrigacao-cristalina/layer_atlas.html",
  "evidencias/irrigacao-cristalina/data/visual_review_targets.geojson",
];

for (const file of publicFiles) {
  if (fs.existsSync(path.join(root, file))) assertNoPattern(file, forbiddenPublicPattern, "internal method terms");
}

const geoPath = "evidencias/irrigacao-cristalina/data/visual_review_targets.geojson";
if (fs.existsSync(path.join(root, geoPath))) {
  const geojson = JSON.parse(read(geoPath));
  const forbiddenKeys = new Set([
    "field_id",
    "cluster",
    "lat",
    "lon",
    "label_hint",
    "area_context",
    "observations",
    "ndvi_mean",
    "ndwi_mean",
    "ndmi_mean",
    "ndvi_high_persistence",
    "ndmi_positive_persistence",
    "ndmi_strong_persistence",
    "temporal_stability",
    "calibrated_score",
    "gate",
    "route",
    "reason",
    "human_lock",
    "visual_decision",
    "visual_reason",
    "reviewer",
  ]);
  const keys = new Set();
  for (const feature of geojson.features || []) {
    Object.keys(feature.properties || {}).forEach((key) => keys.add(key));
  }
  const badKeys = [...keys].filter((key) => forbiddenKeys.has(key));
  if (badKeys.length) fail.push(`${geoPath} has forbidden keys: ${badKeys.join(", ")}`);
  const decimals = maxCoordDecimals(geojson);
  if (decimals > 1) fail.push(`${geoPath} has coordinates with ${decimals} decimal places`);
}

const vercelignore = fs.existsSync(path.join(root, ".vercelignore")) ? read(".vercelignore") : "";
const requiredIgnorePatterns = [
  "evidencias/**/data/*.csv",
  "assets/private/**",
  "scripts/**",
  "*.md",
  "analytics.json",
];
for (const pattern of requiredIgnorePatterns) {
  if (!vercelignore.includes(pattern)) fail.push(`.vercelignore missing pattern: ${pattern}`);
}

try {
  const trackedRaw = execSync(
    'git ls-files "evidencias/**/data/*.csv" "evidencias/**/data/summary.json" "evidencias/**/data/source_manifest.json" "evidencias/**/data/metricas.json"',
    { cwd: root, encoding: "utf8" }
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (trackedRaw.length) fail.push(`Raw data is tracked by Git: ${trackedRaw.join(", ")}`);
} catch (error) {
  fail.push(`Unable to inspect tracked raw files: ${error.message}`);
}

if (fail.length) {
  console.error("Predeploy check failed:");
  for (const item of fail) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Predeploy check passed.");
