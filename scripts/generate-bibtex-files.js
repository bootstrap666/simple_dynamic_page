import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadPublications } from "../src/lib/publications.js";

/* __dirname em ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, "../public/bib");
fs.mkdirSync(outDir, { recursive: true });

const { journals, conferences } = loadPublications();
const all = [...journals, ...conferences];

for (const p of all) {
  if (!p._key || !p.rawBibtex) continue;

  const file = path.join(outDir, `${p._key}.bib`);
  fs.writeFileSync(file, p.rawBibtex.trim() + "\n", "utf8");
}

console.log(`✓ Generated ${all.length} BibTeX files`);

