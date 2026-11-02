-- ============================================================
-- DATABASE
-- ============================================================

DROP DATABASE IF EXISTS AniWatchList;
CREATE DATABASE IF NOT EXISTS AniWatchList;
USE AniWatchList;


-- ============================================================
-- TABLE: users
-- Menyimpan data akun pengguna
-- ============================================================

CREATE TABLE users (
    us_id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    us_name       VARCHAR(50)   NOT NULL UNIQUE,
    us_email      VARCHAR(100)  NOT NULL UNIQUE,
    us_password   VARCHAR(255)  NOT NULL,
    us_created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;


-- ============================================================
-- TABLE: animes
-- Menyimpan anime yang ditambahkan user ke My List
-- ============================================================

CREATE TABLE animes (
    anim_id               INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    us_id                 INT UNSIGNED  NOT NULL,
    external_id           INT UNSIGNED  NOT NULL,
    external_source       VARCHAR(30)   NOT NULL,
    anim_title            VARCHAR(255)  NOT NULL,
    anim_img_url          TEXT,
    anim_current_episode  INT UNSIGNED  DEFAULT 0,
    anim_total_episode    INT UNSIGNED  DEFAULT 0,
    anim_type             ENUM('TV','Movie','OVA','ONA','Special') DEFAULT 'TV',
    anim_status           ENUM('watching','completed','dropped','plan to watch') DEFAULT 'watching',
    anim_tier             ENUM('S','A','B','C','D') DEFAULT NULL,
    anim_score            TINYINT UNSIGNED
                          CHECK (anim_score BETWEEN 1 AND 10),
    anim_personal_notes   TEXT,
    anim_created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_anime UNIQUE (us_id, external_source, external_id),
    CONSTRAINT fk_anime_user
        FOREIGN KEY (us_id) REFERENCES users(us_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_animes_us_id (us_id)
) ENGINE = InnoDB;


-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER //

-- ------------------------------------------------------------
-- sp_insert_user
-- Menambahkan user baru dan mengembalikan data user.
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_insert_user//

CREATE PROCEDURE sp_insert_user (
    IN p_us_name     VARCHAR(50),
    IN p_us_email    VARCHAR(100),
    IN p_us_password VARCHAR(255)
)
BEGIN
    INSERT INTO users (us_name, us_email, us_password)
    VALUES (p_us_name, p_us_email, p_us_password);

    SELECT us_id, us_name, us_email, us_created_at
    FROM users
    WHERE us_id = LAST_INSERT_ID();
END//


-- ------------------------------------------------------------
-- sp_insert_anime
-- Menambahkan anime ke My List milik user.
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_insert_anime//

CREATE PROCEDURE sp_insert_anime (
    IN p_us_id              INT UNSIGNED,
    IN p_external_id        INT UNSIGNED,
    IN p_external_source    VARCHAR(30),
    IN p_anim_title         VARCHAR(255),
    IN p_anim_img_url       TEXT,
    IN p_anim_total_episode INT UNSIGNED,
    IN p_anim_type          ENUM('TV','Movie','OVA','ONA','Special'),
    IN p_anim_status        ENUM('watching','completed','dropped','plan to watch'),
    IN p_anim_tier          ENUM('S','A','B','C','D'),
    IN p_anim_score         TINYINT UNSIGNED,
    IN p_anim_personal_notes TEXT
)
BEGIN
    DECLARE v_current_ep INT UNSIGNED DEFAULT 0;

    -- Jika langsung completed, episode otomatis = total.
    IF p_anim_status = 'completed' AND p_anim_total_episode > 0 THEN
        SET v_current_ep = p_anim_total_episode;
    END IF;

    INSERT INTO animes (
        us_id, external_id, external_source,
        anim_title, anim_img_url,
        anim_current_episode, anim_total_episode,
        anim_type, anim_status, anim_tier,
        anim_score, anim_personal_notes
    ) VALUES (
        p_us_id, p_external_id, p_external_source,
        p_anim_title, p_anim_img_url,
        v_current_ep, IFNULL(p_anim_total_episode, 0),
        IFNULL(p_anim_type, 'TV'), IFNULL(p_anim_status, 'watching'),
        p_anim_tier, p_anim_score, p_anim_personal_notes
    );

    SELECT *
    FROM animes
    WHERE anim_id = LAST_INSERT_ID();
END//


-- ------------------------------------------------------------
-- sp_update_anime
-- Mengubah progress dan informasi personal anime.
-- ------------------------------------------------------------

DROP PROCEDURE IF EXISTS sp_update_anime//

CREATE PROCEDURE sp_update_anime (
    IN p_anim_id              INT UNSIGNED,
    IN p_us_id                INT UNSIGNED,
    IN p_anim_current_episode INT UNSIGNED,
    IN p_anim_status          ENUM('watching','completed','dropped','plan to watch'),
    IN p_anim_tier            ENUM('S','A','B','C','D'),
    IN p_anim_score           TINYINT UNSIGNED,
    IN p_anim_personal_notes  TEXT
)
BEGIN
    DECLARE v_total_ep      INT UNSIGNED DEFAULT 0;
    DECLARE v_final_status  ENUM('watching','completed','dropped','plan to watch');
    DECLARE v_found         BOOLEAN DEFAULT FALSE;

    DECLARE EXIT HANDLER FOR NOT FOUND
    BEGIN
        SET v_found = TRUE;
    END;

    SELECT anim_total_episode
    INTO v_total_ep
    FROM animes
    WHERE anim_id = p_anim_id AND us_id = p_us_id;

    IF v_found THEN
        SELECT 'Anime tidak ditemukan.' AS message;
    ELSE
        SET v_final_status = p_anim_status;

        IF v_total_ep > 0 AND IFNULL(p_anim_current_episode, 0) >= v_total_ep THEN
            SET v_final_status = 'completed';
        END IF;

        UPDATE animes
        SET
            anim_current_episode  = IFNULL(p_anim_current_episode, 0),
            anim_status           = v_final_status,
            anim_tier             = p_anim_tier,
            anim_score            = p_anim_score,
            anim_personal_notes   = p_anim_personal_notes
        WHERE anim_id = p_anim_id AND us_id = p_us_id;

        SELECT *
        FROM animes
        WHERE anim_id = p_anim_id AND us_id = p_us_id;
    END IF;
END//

DELIMITER ;


-- ============================================================
-- TEST / DEVELOPMENT
-- ============================================================

-- SELECT * FROM users;
-- SELECT * FROM animes;   