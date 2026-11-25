import db from "../../config/db.mjs";
import { getAnimeBatches } from "../../integrations/anilist/index.mjs";
import { toCatalogRow } from "./catalog.service.mjs";

const SOURCE = "anilist";

// One-off maintenance: re-fetch every catalog row from AniList and rewrite
// title (romaji), cover, episodes, type and synced_at. Rows AniList does not
// return are never touched. With dryRun nothing is written.
export const refreshCatalog = async ({
  dryRun = false,
  log = console.log,
  ...batchOptions // batchSize, delayMs, maxRetries, sleep
} = {}) => {
  const [rows] = await db.query(
    `SELECT external_id, title, cover_image, total_episodes, anim_type
     FROM anime_catalog WHERE source = ? ORDER BY external_id`,
    [SOURCE],
  );
  const byId = new Map(rows.map((row) => [Number(row.external_id), row]));
  const summary = {
    dryRun,
    total: rows.length,
    updated: 0,
    unchanged: 0,
    notFound: 0,
    failed: 0,
  };

  let batchNumber = 0;
  for await (const batch of getAnimeBatches([...byId.keys()], batchOptions)) {
    batchNumber += 1;
    if (batch.error) {
      summary.failed += batch.ids.length;
      log(`Batch ${batchNumber} gagal: ${batch.error.message}`);
      continue;
    }

    const returned = new Map(batch.media.map((media) => [media.id, media]));
    for (const id of batch.ids) {
      const media = returned.get(id);
      if (!media) {
        summary.notFound += 1;
        continue;
      }

      const next = toCatalogRow(media);
      const current = byId.get(id);
      const changed =
        current.title !== next.title ||
        (current.cover_image ?? null) !== next.coverImage ||
        Number(current.total_episodes) !== next.totalEpisodes ||
        current.anim_type !== next.type;

      if (!dryRun) {
        try {
          await db.execute(
            `UPDATE anime_catalog
             SET title = ?, cover_image = ?, total_episodes = ?,
                 anim_type = ?, synced_at = NOW()
             WHERE external_id = ? AND source = ?`,
            [
              next.title,
              next.coverImage,
              next.totalEpisodes,
              next.type,
              id,
              SOURCE,
            ],
          );
        } catch (error) {
          summary.failed += 1;
          log(`Gagal menulis external_id ${id}: ${error.message}`);
          continue;
        }
      }

      if (changed) summary.updated += 1;
      else summary.unchanged += 1;
    }
    log(`Batch ${batchNumber} selesai (${batch.ids.length} id).`);
  }

  return summary;
};
