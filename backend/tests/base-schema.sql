-- Base tables for the TEST database only. Copied from project_akhir_blk.sql.
-- No CREATE DATABASE, USE, DELIMITER, or procedures here.
-- Do not put semicolons inside comments.

CREATE TABLE IF NOT EXISTS users (
    us_id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
    us_name       VARCHAR(50)   NOT NULL UNIQUE,
    us_email      VARCHAR(100)  NOT NULL UNIQUE,
    us_password   VARCHAR(255)  NOT NULL,
    us_created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS animes (
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

CREATE PROCEDURE IF NOT EXISTS sp_insert_user (
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
END;