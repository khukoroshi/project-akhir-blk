-- 004: retire the old animes table and its two stored procedures.
-- The table is renamed (data kept as a backup), never dropped here.
-- Idempotent: rename only when animes exists and animes_legacy does not.
-- sp_insert_user and the users table are NOT touched.

SET @rename_animes = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'animes') = 1
    AND
    (SELECT COUNT(*) FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'animes_legacy') = 0,
    'RENAME TABLE animes TO animes_legacy',
    'SELECT 1'
  )
);

PREPARE stmt FROM @rename_animes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP PROCEDURE IF EXISTS sp_insert_anime;
DROP PROCEDURE IF EXISTS sp_update_anime;