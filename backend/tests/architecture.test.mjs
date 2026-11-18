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

// Rule (c): only these folders may sit directly under src/ (plus app.mjs).
const ALLOWED_TOP_DIRS = new Set([
  "config",
  "db",
  "integrations",
  "middlewares",
  "modules",
  "utils",
]);
const ALLOWED_TOP_FILES = new Set(["app.mjs"]);

// entries: [{ name, isDir }] directly under src/
const checkTopLevel = (entries) =>
  entries.flatMap(({ name, isDir }) => {
    if (isDir && !ALLOWED_TOP_DIRS.has(name)) {
      return [
        `src/${name}/: folder "${name}" tidak diizinkan di src/. ` +
          `Kode baru harus berada di modules/<nama>/ ` +
          `(folder yang diizinkan: ${[...ALLOWED_TOP_DIRS].join(", ")})`,
      ];
    }
    if (!isDir && !ALLOWED_TOP_FILES.has(name)) {
      return [
        `src/${name}: file tidak diizinkan langsung di src/ (hanya app.mjs). ` +
          `Kode baru harus berada di modules/<nama>/`,
      ];
    }
    return [];
  });

// Rule (d): modulesMap = { moduleName: [fileNames directly inside it] }
const checkModuleIndexes = (modulesMap) =>
  Object.entries(modulesMap)
    .filter(([, files]) => !files.includes("index.mjs"))
    .map(
      ([name]) =>
        `src/modules/${name}/: modul "${name}" wajib punya index.mjs (satu-satunya pintu masuk modul)`,
    );

const readTopLevel = () =>
  readdirSync(SRC, { withFileTypes: true }).map((d) => ({
    name: d.name,
    isDir: d.isDirectory(),
  }));

const readModulesMap = () => {
  const dir = path.join(SRC, "modules");
  return Object.fromEntries(
    readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => [
        d.name,
        readdirSync(path.join(dir, d.name), { withFileTypes: true })
          .filter((f) => f.isFile())
          .map((f) => f.name),
      ]),
  );
};

// relPath is relative to src/, with forward slashes.
const checkFile = (relPath, source) => {
  const violations = [];
  const fromDir = path.posix.dirname(relPath);
  const ownModule = moduleOf(relPath);

  for (const { specifier, line } of findImports(source)) {
    if (!specifier.startsWith(".")) continue; // packages and node: imports

    const target = path.posix.normalize(path.posix.join(fromDir, specifier));
    const where = `src/${relPath}:${line}`;

    // Rule (e): no import (static or dynamic) into a forbidden top-level folder.
    const topFolder = target.split("/")[0];
    if (
      target.includes("/") &&
      topFolder !== ".." &&
      !ALLOWED_TOP_DIRS.has(topFolder)
    ) {
      violations.push(
        `${where}: impor ke folder "${topFolder}" dilarang. ` +
          `Kode harus berada di modules/<nama>/ ("${specifier}")`,
      );
      continue;
    }

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
      `} from "./modules/anime/anime.controller.mjs";`,
      `export { b } from "./modules/anime/catalog.service.mjs";`,
      `const c = await import("./modules/anime/anime.routes.mjs");`,
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

describe("arsitektur: struktur folder src/", () => {
  it("hanya folder yang diizinkan di bawah src/ (aturan c)", () => {
    const violations = checkTopLevel(readTopLevel());

    expect(
      violations,
      `Pelanggaran struktur:\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("setiap folder di modules/ punya index.mjs (aturan d)", () => {
    const violations = checkModuleIndexes(readModulesMap());

    expect(
      violations,
      `Pelanggaran struktur:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});

describe("arsitektur: pemeriksa struktur itu sendiri", () => {
  it("menolak folder terlarang dan menyebut namanya (aturan c)", () => {
    const result = checkTopLevel([
      { name: "modules", isDir: true },
      { name: "app.mjs", isDir: false },
      { name: "services", isDir: true },
      { name: "models", isDir: true },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toContain('"services"');
    expect(result[0]).toContain("modules/<nama>/");
    expect(result[1]).toContain('"models"');
  });

  it("menolak file lepas selain app.mjs di src/ (aturan c)", () => {
    const result = checkTopLevel([{ name: "helper.mjs", isDir: false }]);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("helper.mjs");
  });

  it("menerima semua folder yang diizinkan (aturan c)", () => {
    const names = [
      "config",
      "db",
      "integrations",
      "middlewares",
      "modules",
      "utils",
    ];

    expect(checkTopLevel(names.map((name) => ({ name, isDir: true })))).toEqual(
      [],
    );
  });

  it("menolak modul tanpa index.mjs (aturan d)", () => {
    const result = checkModuleIndexes({
      anime: ["index.mjs", "anime.routes.mjs"],
      baru: ["baru.service.mjs"],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('"baru"');
  });

  it("menolak import statis dan dinamis ke folder terlarang (aturan e)", () => {
    const source = [
      `import a from "./services/x.mjs";`,
      `const b = await import("../models/y.mjs");`,
    ].join("\n");

    const fromApp = checkFile("app.mjs", source.split("\n")[0]);
    const fromMiddleware = checkFile(
      "middlewares/z.mjs",
      source.split("\n")[1],
    );

    expect(fromApp).toHaveLength(1);
    expect(fromApp[0]).toContain('folder "services"');
    expect(fromApp[0]).toContain("src/app.mjs:1");
    expect(fromMiddleware).toHaveLength(1);
    expect(fromMiddleware[0]).toContain('folder "models"');
  });

  it("menerima import ke folder yang diizinkan (aturan e)", () => {
    expect(
      checkFile(
        "modules/auth/auth.service.mjs",
        `import { AppError } from "../../utils/appError.mjs";`,
      ),
    ).toEqual([]);
    expect(checkFile("app.mjs", `import env from "./config/env.mjs";`)).toEqual(
      [],
    );
  });
});
