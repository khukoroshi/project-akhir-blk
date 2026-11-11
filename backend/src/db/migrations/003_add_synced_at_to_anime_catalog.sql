-- 003: track when a catalog row was last refreshed from AniList.
-- Idempotent: the column is only added when it does not exist yet.

SET @add_synced_at = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE anime_catalog ADD COLUMN synced_at TIMESTAMP NULL DEFAULT NULL',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'anime_catalog'
    AND COLUMN_NAME = 'synced_at'
);

PREPARE stmt FROM @add_synced_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;