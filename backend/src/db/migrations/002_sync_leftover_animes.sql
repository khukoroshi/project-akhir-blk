-- 002: copy rows added or changed in animes after migration 001.
-- Run BEFORE the new code goes live. Old table animes is NOT touched.
-- Do not put semicolons inside comments.

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

INSERT INTO user_anime (id, user_id, anime_id, status, episodes_watched, score, tier, notes, created_at)
SELECT a.anim_id, a.us_id, c.id,
       IFNULL(a.anim_status, 'watching'), IFNULL(a.anim_current_episode, 0),
       a.anim_score, a.anim_tier, a.anim_personal_notes, a.anim_created_at
FROM animes a
JOIN anime_catalog c
  ON c.external_id = a.external_id AND c.source = 'anilist'
WHERE a.external_source = 'anilist'
  AND NOT EXISTS (SELECT 1 FROM user_anime ua WHERE ua.id = a.anim_id)
  AND NOT EXISTS (
    SELECT 1 FROM user_anime ua2
    WHERE ua2.user_id = a.us_id AND ua2.anime_id = c.id
  );

-- Sync edits made in animes after 001 (animes is still the source of truth until the new code is live).
UPDATE user_anime ua
JOIN animes a ON a.anim_id = ua.id
SET ua.status = IFNULL(a.anim_status, 'watching'),
    ua.episodes_watched = IFNULL(a.anim_current_episode, 0),
    ua.score = a.anim_score,
    ua.tier = a.anim_tier,
    ua.notes = a.anim_personal_notes;