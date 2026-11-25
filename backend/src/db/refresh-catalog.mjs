// One-off maintenance CLI (T1). Thin wrapper: the logic lives in modules/anime.
// Usage: pnpm catalog:refresh [--dry-run]
const args = process.argv.slice(2).filter((arg) => arg !== "--"); // pnpm may pass "--"
const unknown = args.filter((arg) => arg !== "--dry-run");

if (unknown.length > 0) {
  console.error(
    `Argumen tidak dikenal: ${unknown.join(" ")}. Pakai: pnpm catalog:refresh [--dry-run]`,
  );
  process.exit(1);
}

const dryRun = args.includes("--dry-run");

await import("dotenv/config");
const { default: db } = await import("../config/db.mjs");
const { refreshCatalog } = await import("../modules/anime/index.mjs");

try {
  console.log(
    dryRun ? "Mode dry-run: tidak ada yang ditulis." : "Memperbarui katalog...",
  );
  const s = await refreshCatalog({ dryRun });
  console.log(
    `${dryRun ? "Dry-run selesai" : "Selesai"}. Total: ${s.total}, ` +
      `${dryRun ? "akan diperbarui" : "diperbarui"}: ${s.updated}, ` +
      `tidak berubah: ${s.unchanged}, tidak ditemukan: ${s.notFound}, gagal: ${s.failed}`,
  );
  if (s.failed > 0) process.exitCode = 1;
} catch (error) {
  console.error("Refresh katalog gagal:", error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
