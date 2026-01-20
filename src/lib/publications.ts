import fs from "fs";
import bibtexParse from "bibtex-parse-js";

export type Pub = {
  _key: string;
  _type: string;
  title?: string;
  author?: string;
  journal?: string;
  booktitle?: string;
  year?: string;
  doi?: string;
};

const PARTICLES = [
  "da", "de", "do", "dos", "das",
  "van", "von", "der", "den",
  "del", "della"
];

function stripOuterBraces(text?: string) {
  if (!text) return text;
  return text.replace(/^\{+/, "").replace(/\}+$/, "");
}

function latexToUnicode(text?: string) {
  if (!text) return text;

  const map: Record<string, string> = {
    "\\'a": "á", "\\'e": "é", "\\'i": "í", "\\'o": "ó", "\\'u": "ú",
    "\\'A": "Á", "\\'E": "É", "\\'I": "Í", "\\'O": "Ó", "\\'U": "Ú",
    "\\~a": "ã", "\\~o": "õ", "\\~A": "Ã", "\\~O": "Õ",
    "\\^a": "â", "\\^e": "ê", "\\^i": "î", "\\^o": "ô", "\\^u": "û",
    "\\`a": "à", "\\`e": "è", "\\`i": "ì", "\\`o": "ò", "\\`u": "ù",
    "\\c{c}": "ç", "\\c{C}": "Ç",
    "{\\i}": "í", "\\i": "í"
  };

  let out = text;
  for (const k in map) {
    out = out.split(k).join(map[k]);
  }
  return out;
}

function normalizeBibField(text?: string) {
  return latexToUnicode(stripOuterBraces(text));
}

function formatAuthorName(author: string) {
  author = author.trim();

  if (author.includes(",")) {
    const [last, first] = author.split(",").map(s => s.trim());
    const initials = first
      .split(/\s+/)
      .map(n => n[0]?.toUpperCase() + ".")
      .join(" ");
    return `${last}, ${initials}`;
  }

  const parts = author.split(/\s+/);
  const last: string[] = [];
  const first: string[] = [];

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].toLowerCase();
    if (last.length === 0 || PARTICLES.includes(p)) {
      last.unshift(parts[i]);
    } else {
      first.unshift(parts[i]);
    }
  }

  const initials = first
    .map(n => n[0]?.toUpperCase() + ".")
    .join(" ");

  return `${last.join(" ")}, ${initials}`;
}

function formatAuthors(authors?: string) {
  if (!authors) return undefined;
  return authors
    .split(/\s+and\s+/i)
    .map(a => formatAuthorName(a))
    .join("; ");
}

function normalizeDOI(doi?: string) {
  if (!doi) return undefined;
  return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "");
}

function sortByYearDesc(a: Pub, b: Pub) {
  return (parseInt(b.year ?? "0")) - (parseInt(a.year ?? "0"));
}

export function loadPublications() {
  const bib = fs.readFileSync("publications.bib", "utf8");
  const entries = bibtexParse.toJSON(bib);

  const journals: Pub[] = [];
  const conferences: Pub[] = [];

  entries.forEach(e => {
    const f: Pub = {
      _key: e.citationKey,
      _type: e.entryType,
      title: normalizeBibField(e.entryTags.title),
      author: formatAuthors(normalizeBibField(e.entryTags.author)),
      journal: normalizeBibField(e.entryTags.journal),
      booktitle: normalizeBibField(e.entryTags.booktitle),
      year: e.entryTags.year,
      doi: normalizeDOI(e.entryTags.doi)
    };

    if (e.entryType.toLowerCase() === "article") journals.push(f);
    if (["inproceedings", "conference"].includes(e.entryType.toLowerCase()))
      conferences.push(f);
  });

  journals.sort(sortByYearDesc);
  conferences.sort(sortByYearDesc);

  return { journals, conferences };
}
