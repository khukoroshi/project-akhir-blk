import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

// Blank out comments but keep line breaks, so line numbers stay correct.
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`])\/\/.*$/gm, (_match, lead) => lead);

const IMPORT_PATTERNS = [
  // import x from "a" / export { x } from "a" (also multi-line)
  /\b(?:import|export)\b[^'"`;]*?\bfrom\s*["']([^"']+)["']/g,
  // import "a"
  /\bimport\s*["']([^"']+)["']/g,
  // import("a")
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
];

const findImports = (source) => {
  const clean = stripComments(source);
  const found = [];

  for (const pattern of IMPORT_PATTERNS) {
    for (const match of clean.matchAll(pattern)) {
      const specifier = match[1];
      const offset = match.index + match[0].lastIndexOf(specifier);
      const line = clean.slice(0, offset).split("\n").length;
      found.push({ specifier, line });
    }
  }

  return found;
};

// "modules/anime/x.mjs" -> "anime", anything else -> null
const moduleOf = (relPath) =>
  relPath.match(/^modules\/([^/]+)(?:\/|$)/)?.[1] ?? null;

// relPath is relative to src/, with forward slashes.
const checkFile = (relPath, source) => {
  const violations = [];
  const fromDir = path.posix.dirname(relPath);
  const ownModule = moduleOf(relPath);

  for (const { specifier, line } of findImports(source)) {
    if (!specifier.startsWith(".")) continue; // packages and node: imports

    const target = path.posix.normalize(path.posix.join(fromDir, specifier));
    const where = `src/${relPath}:${line}`;

    if (relPath.startsWith("integrations/") && moduleOf(target) !== null) {
      violations.push(
        `${where}: integrations/ tidak boleh mengimpor dari modules/ ("${specifier}")`,
      );
      continue;
    }

    const targetModule = moduleOf(target);
    if (
      targetModule !== null &&
      targetModule !== ownModule &&
      target !== `modules/${targetModule}/index.mjs`
    ) {
      violations.push(
        `${where}: impor ke modul "${targetModule}" harus lewat modules/${targetModule}/index.mjs ("${specifier}")`,
      );
    }
  }

  return violations;
};

const listMjsFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listMjsFiles(full);
    return full.endsWith(".mjs") ? [full] : [];
  });

describe("arsitektur: batas modul", () => {
  it("semua file di src/ mematuhi aturan import", () => {
    const violations = listMjsFiles(SRC).flatMap((file) => {
      const rel = path.relative(SRC, file).split(path.sep).join("/");
      return checkFile(rel, readFileSync(file, "utf8"));
    });

    expect(
      violations,
      `Pelanggaran arsitektur:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});

describe("arsitektur: pemeriksa itu sendiri", () => {
  it("menolak import ke file dalam modul lain, dengan file dan baris", () => {
    const source = `import db from "../config/db.mjs";\nimport x from "../modules/anime/catalog.service.mjs";\n`;

    const result = checkFile("models/anim.model.mjs", source);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("src/models/anim.model.mjs:2");
  });

  it("menerima import lewat index.mjs dan import dalam modul sendiri", () => {
    expect(
      checkFile(
        "models/anim.model.mjs",
        `import { a } from "../modules/anime/index.mjs";`,
      ),
    ).toEqual([]);
    expect(
      checkFile(
        "modules/anime/anime.routes.mjs",
        `import { a } from "./anime.controller.mjs";`,
      ),
    ).toEqual([]);
  });

  it("mendeteksi import multi-baris, export-from, dan import dinamis", () => {
    const source = [
      `import {`,
      `  a,`,
      `} from "../modules/anime/anime.controller.mjs";`,
      `export { b } from "../modules/anime/catalog.service.mjs";`,
      `const c = await import("../modules/anime/anime.routes.mjs");`,
    ].join("\n");

    const result = checkFile("app.mjs", source);

    expect(result).toHaveLength(3);
    expect(result[0]).toContain("src/app.mjs:3");
  });

  it("melarang integrations/ mengimpor dari modules/ (termasuk index)", () => {
    const result = checkFile(
      "integrations/anilist/x.mjs",
      `import { a } from "../../modules/anime/index.mjs";`,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("integrations/");
  });

  it("mengabaikan import di dalam komentar dan paket npm", () => {
    const source = `// import x from "../modules/anime/anime.controller.mjs";\nimport express from "express";`;

    expect(checkFile("app.mjs", source)).toEqual([]);
  });
});
