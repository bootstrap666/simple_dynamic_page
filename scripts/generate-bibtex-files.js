import fs from "fs";
import path from "path";
import bibtexParse from "bibtex-parse-js";
import { fileURLToPath } from "url";

/* __dirname */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* paths */
const bibFile = path.resolve(__dirname, "../publications.bib");
const outDir = path.resolve(__dirname, "../public/bib");

fs.mkdirSync(outDir, { recursive: true });

/* read + parse bibtex */
const raw = fs.readFileSync(bibFile, "utf8");
const entries = bibtexParse.toJSON(raw);

let count = 0;

for (const e of entries) {
  const key = e.citationKey;
  if (!key) continue;

  const bib = raw.match(
    new RegExp(`@${e.entryType}\\s*\\{\\s*${key}[\\s\\S]*?\\n\\}`, "m")
  );

  if (!bib) continue;

  fs.writeFileSync(
    path.join(outDir, `${key}.bib`),
    bib[0].trim() + "\n",
    "utf8"
  );

  count++;
}

console.log(`✓ Generated ${count} BibTeX files`);

