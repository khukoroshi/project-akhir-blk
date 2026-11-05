-- 001: split animes into anime_catalog (shared) and user_anime (per user).
-- Old table `animes` is NOT touched. Do not put semicolons inside comments.

CREATE TABLE IF NOT EXISTS anime_catalog (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  external_id    INT UNSIGNED NOT NULL,
  source         ENUM('anilist') NOT NULL DEFAULT 'anilist',
  title          VARCHAR(255) NOT NULL,
  cover_image    TEXT NULL,
  total_episodes INT UNSIGNED NOT NULL DEFAULT 0,
  anim_type      ENUM('TV','Movie','OVA','ONA','Special','TV Short','Music')
                 NOT NULL DEFAULT 'TV',
  status         VARCHAR(50) NULL,
  synopsis       TEXT NULL,
  genres         JSON NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_external_anime (external_id, source)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS user_anime (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL,
  anime_id         INT UNSIGNED NOT NULL,
  status           ENUM('watching','completed','plan to watch','dropped','on hold','rewatching')
                   NOT NULL DEFAULT 'watching',
  episodes_watched INT UNSIGNED NOT NULL DEFAULT 0,
  score            DECIMAL(3,1) NULL,
  tier             ENUM('S','A','B','C','D') NULL,
  notes            TEXT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_anime_score CHECK (score BETWEEN 1 AND 10),
  CONSTRAINT fk_user_anime_user
    FOREIGN KEY (user_id) REFERENCES users(us_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_anime_catalog
    FOREIGN KEY (anime_id) REFERENCES anime_catalog(id)
    ON DELETE CASCADE,
  UNIQUE KEY unique_user_anime (user_id, anime_id)
) ENGINE = InnoDB;

-- Copy catalog data: one row per anime, newest anim_id wins on conflict.
-- Rows from other sources (e.g. jikan) are skipped.
INSERT INTO anime_catalog (external_id, source, title, cover_image, total_episodes, anim_type)
SELECT a.external_id, 'anilist', a.anim_title, a.anim_img_url,
       IFNULL(a.anim_total_episode, 0), IFNULL(a.anim_type, 'TV')
FROM animes a
JOIN (
  SELECT external_id, MAX(anim_id) AS max_id
  FROM animes
  WHERE external_source = 'anilist'
  GROUP BY external_id
) latest ON latest.max_id = a.anim_id
WHERE NOT EXISTS (
  SELECT 1 FROM anime_catalog c
  WHERE c.external_id = a.external_id AND c.source = 'anilist'
);

-- Copy watchlist data, keeping the old anim_id as user_anime.id.
INSERT INTO user_anime (id, user_id, anime_id, status, episodes_watched, score, tier, notes, created_at)
SELECT a.anim_id, a.us_id, c.id,
       IFNULL(a.anim_status, 'watching'), IFNULL(a.anim_current_episode, 0),
       a.anim_score, a.anim_tier, a.anim_personal_notes, a.anim_created_at
FROM animes a
JOIN anime_catalog c
  ON c.external_id = a.external_id AND c.source = 'anilist'
WHERE a.external_source = 'anilist'
  AND NOT EXISTS (SELECT 1 FROM user_anime ua WHERE ua.id = a.anim_id);