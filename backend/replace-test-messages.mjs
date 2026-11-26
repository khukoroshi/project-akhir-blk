#!/usr/bin/env node
// Menerjemahkan teks pesan lama (Indonesia) ke pesan baru (Inggris) di berkas tes,
// berdasarkan tabel hasil L2A. Default: DRY-RUN (hanya menampilkan perubahan).
// Pakai:  node replace-test-messages.mjs <tabel.md> <folder> [--write] [--ext=mjs,js,bru]
import fs from "node:fs";
import path from "node:path";

const [, , tablePath, testsDir, ...flags] = process.argv;
const WRITE = flags.includes("--write");
const extFlag = flags.find((f) => f.startsWith("--ext="));
const EXTS = (extFlag ? extFlag.slice(6) : "mjs,js")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
const EXT_RE = new RegExp(`\\.(${EXTS.join("|")})$`);
if (!tablePath || !testsDir) {
  console.error(
    "Pemakaian: node replace-test-messages.mjs <tabel.md> <folder> [--write] [--ext=mjs,js,bru]",
  );
  process.exit(1);
}

// ---------- 1. Baca tabel ----------
const rows = [];
for (const raw of fs.readFileSync(tablePath, "utf8").split(/\r?\n/)) {
  if (!raw.startsWith("|")) continue;
  const cells = raw
    .slice(1, raw.lastIndexOf("|"))
    .split("|")
    .map((c) => c.trim());
  if (cells.length !== 3 || /^-+$/.test(cells[0].replace(/\s/g, ""))) continue;
  if (cells[0] === "Berkas") continue;
  rows.push({ file: cells[0], oldMsg: cells[1], newMsg: cells[2] });
}

const skipped = [];
const exact = new Map(); // old -> Set(new)

const PLACEHOLDER = /\$\{|<label>|…|\(X\)|\(Y\)|: a, b|: a$|\bN\b|^subject:/;
const NOTE = /\s*\((?:\d+ tempat|fallback 404|teks \/)\)\s*$/;

for (const r of rows) {
  let o = r.oldMsg.replace(NOTE, "").trim();
  const n = r.newMsg.trim();
  if (PLACEHOLDER.test(o) || PLACEHOLDER.test(n)) {
    skipped.push(`${r.file}: ${o}  =>  ${n}`);
    continue;
  }
  // "Nama minimal 3 karakter / maksimal 50 karakter" -> dua pesan lama
  const parts = o.split(" / ");
  const olds = [parts[0]];
  if (parts.length > 1) {
    const prefix = parts[0].split(/\s+(?:minimal|maksimal)\b/)[0];
    for (const p of parts.slice(1))
      olds.push(/^(minimal|maksimal)\b/.test(p) ? `${prefix} ${p}` : p);
  }
  for (const oo of olds) {
    if (!exact.has(oo)) exact.set(oo, new Set());
    exact.get(oo).add(n);
  }
}

const ambiguous = [...exact].filter(([, s]) => s.size > 1);
for (const [o, s] of ambiguous)
  skipped.push(
    `AMBIGU (lama sama, baru berbeda): "${o}"  =>  ${[...s].join("  |  ")}`,
  );
const rules = [...exact]
  .filter(([, s]) => s.size === 1)
  .map(([o, s]) => ({ o, n: [...s][0] }))
  .sort((a, b) => b.o.length - a.o.length); // yang panjang dulu, agar tidak merusak awalan

// Aturan berpola (berlaku di semua baris)
const regexRules = [
  [
    /Field '([^']+)' tidak dikenal\. Katalog diisi server dari AniList\.?/g,
    "Field '$1' is not recognized. The catalog is filled by the server from AniList",
  ],
  [
    /Episode \((.+?)\) tidak boleh melebihi total episode \((.+?)\)/g,
    "Episodes ($1) cannot exceed total episodes ($2)",
  ],
  [/Field tidak dikenal: /g, "Unknown field: "],
  [/Parameter tidak dikenal: /g, "Unknown parameter: "],
];

// Potongan kata (hanya di baris asersi, untuk pesan laju dan sejenisnya)
const fragments = [
  ["Terlalu banyak", "Too many"],
  ["Coba lagi dalam", "Try again in"],
  ["percobaan pendaftaran", "registration attempts"],
  ["percobaan login", "login attempts"],
  ["penambahan anime", "requests to add anime"],
  ["perubahan profil", "profile update requests"],
  ["permintaan follow", "follow requests"],
  ["permintaan", "requests"],
  ["menit", "minute"],
  ["detik", "second"],
];
const ASSERTION =
  /\b(expect|toMatch|toContain|toBe|toEqual|toHaveProperty|toStrictEqual|message)\b/;
const TITLE = /^\s*(it|test|describe)(\.\w+)?\s*\(/;

// ---------- 2. Terapkan ke berkas tes ----------
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(p);
    return EXT_RE.test(e.name) ? [p] : [];
  });
}

const used = new Map();
let changedFiles = 0,
  changedLines = 0;
const report = [];

for (const file of walk(testsDir)) {
  const src = fs.readFileSync(file, "utf8");
  const eol = src.includes("\r\n") ? "\r\n" : "\n";
  const lines = src.split(/\r?\n/);
  let fileChanged = false;
  const out = lines.map((line, i) => {
    // Baris judul tes murni (it/test/describe tanpa asersi) dibiarkan: itu deskripsi untuk developer.
    if (TITLE.test(line) && !ASSERTION.test(line.replace(TITLE, "")))
      return line;
    let cur = line;
    for (const { o, n } of rules) {
      if (cur.includes(o)) {
        cur = cur.split(o).join(n);
        used.set(o, (used.get(o) || 0) + 1);
      }
    }
    for (const [re, rep] of regexRules) cur = cur.replace(re, rep);
    if (ASSERTION.test(cur) && !TITLE.test(cur)) {
      for (const [a, b] of fragments) cur = cur.split(a).join(b);
    }
    if (cur !== line) {
      fileChanged = true;
      changedLines++;
      report.push(
        `${path.relative(process.cwd(), file)}:${i + 1}\n  - ${line.trim()}\n  + ${cur.trim()}`,
      );
    }
    return cur;
  });
  if (fileChanged) {
    changedFiles++;
    if (WRITE) fs.writeFileSync(file, out.join(eol), "utf8");
  }
}

// ---------- 3. Laporan ----------
console.log(report.join("\n"));
console.log("\n==== RINGKASAN ====");
console.log(
  `${WRITE ? "DITULIS" : "DRY-RUN (belum ada berkas yang diubah)"}: ${changedLines} baris di ${changedFiles} berkas.`,
);
const unused = rules.filter((r) => !used.has(r.o));
console.log(
  `Aturan pesan lengkap yang dipakai: ${used.size} dari ${rules.length}.`,
);
if (skipped.length) {
  console.log(`\nDilewati (perlu cek manual, ${skipped.length}):`);
  for (const s of skipped) console.log("  - " + s);
}
if (!WRITE)
  console.log(
    "\nTinjau perubahan di atas. Jika sudah sesuai, jalankan ulang dengan --write.",
  );
