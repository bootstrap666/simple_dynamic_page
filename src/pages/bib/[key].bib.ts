import type { APIRoute } from "astro";
import fs from "fs";
import bibtexParse from "bibtex-parse-js";

export const GET: APIRoute = ({ params }) => {
  const key = params.key!;
  const bib = fs.readFileSync("publications.bib", "utf8");
  const entries = bibtexParse.toJSON(bib);
  const e = entries.find(x => x.citationKey === key);

  if (!e) {
    return new Response("Not found", { status: 404 });
  }

  let out = `@${e.entryType}{${e.citationKey},\n`;
  for (const [k, v] of Object.entries(e.entryTags)) {
    out += `  ${k} = {${v}},\n`;
  }
  out += "}";

  return new Response(out, {
    headers: {
      "Content-Type": "application/x-bibtex",
      "Content-Disposition": `attachment; filename=${key}.bib`
    }
  });
};
