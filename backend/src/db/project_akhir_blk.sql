DROP DATABASE AniWatchList;
CREATE DATABASE AniWatchList;
USE AniWatchList;

-- ============================================================
-- TABLE: users
-- Menyimpan data akun pengguna
-- ============================================================

CREATE TABLE users (
    us_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    us_name VARCHAR(50) NOT NULL UNIQUE,
    us_email VARCHAR(100) NOT NULL UNIQUE,
    us_password VARCHAR(255) NOT NULL,
    us_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================================================
-- TABLE: animes
-- Menyimpan anime yang ditambahkan user ke My List
-- ============================================================

CREATE TABLE animes (
    anim_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- Relasi ke user pemilik anime
    us_id INT UNSIGNED NOT NULL,
    -- Identitas anime dari sumber eksternal
    external_id INT UNSIGNED NOT NULL,
    external_source VARCHAR(30) NOT NULL,
    -- Informasi anime
    anim_title VARCHAR(255) NOT NULL,
    anim_img_url TEXT,
    -- Progress menonton
    anim_current_episode INT UNSIGNED DEFAULT 0,
    anim_total_episode INT UNSIGNED DEFAULT 0,
    -- Informasi user terhadap anime
    anim_type ENUM(
        'TV',
        'Movie',
        'OVA',
        'ONA',
        'Special'
    ) DEFAULT 'TV',
    anim_status ENUM(
        'watching',
        'completed',
        'dropped',
        'plan to watch'
    ) DEFAULT 'watching',
    anim_tier ENUM(
        'S',
        'A',
        'B',
        'C',
        'D'
    ) DEFAULT NULL,
    anim_score TINYINT UNSIGNED
        CHECK (anim_score BETWEEN 1 AND 10),
    anim_personal_notes TEXT,
    anim_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Setiap user hanya boleh memiliki anime yang sama
    -- satu kali dari sumber yang sama.
    CONSTRAINT uq_user_anime
        UNIQUE (us_id, external_source, external_id),
    -- Relasi anime dengan user
    CONSTRAINT fk_anime_user
        FOREIGN KEY (us_id)
        REFERENCES users(us_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER //


-- ============================================================
-- PROCEDURE: sp_insert_user
-- Menambahkan user baru dan mengembalikan data user
-- ============================================================

-- DROP PROCEDURE IF EXISTS sp_insert_user//

CREATE PROCEDURE sp_insert_user (
    IN p_us_name VARCHAR(50),
    IN p_us_email VARCHAR(100),
    IN p_us_password VARCHAR(255)
)
BEGIN
    INSERT INTO users (
        us_name,
        us_email,
        us_password
    )
    VALUES (
        p_us_name,
        p_us_email,
        p_us_password
    );
    SELECT
        us_id,
        us_name,
        us_email,
        us_created_at
    FROM users
    WHERE us_id = LAST_INSERT_ID();
END//


-- ============================================================
-- PROCEDURE: sp_insert_anime
-- Menambahkan anime ke My List milik user
-- ============================================================

-- DROP PROCEDURE IF EXISTS sp_insert_anime//

CREATE PROCEDURE sp_insert_anime (
    IN p_us_id INT UNSIGNED,
    IN p_external_id INT UNSIGNED,
    IN p_external_source VARCHAR(30),
    IN p_anim_title VARCHAR(255),
    IN p_anim_img_url TEXT,
    IN p_anim_total_episode INT UNSIGNED,
    IN p_anim_type ENUM(
        'TV',
        'Movie',
        'OVA',
        'ONA',
        'Special'
    ),
    IN p_anim_status ENUM(
        'watching',
        'completed',
        'dropped',
        'plan to watch'
    ),
    IN p_anim_tier ENUM(
        'S',
        'A',
        'B',
        'C',
        'D'
    ),
    IN p_anim_score TINYINT UNSIGNED,
    IN p_anim_personal_notes TEXT
)
BEGIN

    DECLARE v_current_ep INT UNSIGNED DEFAULT 0;

    -- Jika anime langsung ditambahkan sebagai completed,
    -- progress episode otomatis menjadi total episode.
    IF p_anim_status = 'completed'
       AND p_anim_total_episode > 0 THEN

        SET v_current_ep = p_anim_total_episode;

    END IF;


    INSERT INTO animes (
        us_id,
        external_id,
        external_source,
        anim_title,
        anim_img_url,
        anim_current_episode,
        anim_total_episode,
        anim_type,
        anim_status,
        anim_tier,
        anim_score,
        anim_personal_notes
    )
    VALUES (
        p_us_id,
        p_external_id,
        p_external_source,
        p_anim_title,
        p_anim_img_url,
        v_current_ep,
        IFNULL(p_anim_total_episode, 0),
        IFNULL(p_anim_type, 'TV'),
        IFNULL(p_anim_status, 'watching'),
        p_anim_tier,
        p_anim_score,
        p_anim_personal_notes
    );


    -- Mengembalikan data anime yang baru ditambahkan.
    SELECT *
    FROM animes
    WHERE anim_id = LAST_INSERT_ID();

END//


-- ============================================================
-- PROCEDURE: sp_update_anime
-- Mengubah progress dan informasi personal anime
-- ============================================================

-- DROP PROCEDURE IF EXISTS sp_update_anime//

CREATE PROCEDURE sp_update_anime (
    IN p_anim_id INT UNSIGNED,
    IN p_us_id INT UNSIGNED,
    IN p_anim_current_episode INT UNSIGNED,
    IN p_anim_status ENUM(
        'watching',
        'completed',
        'dropped',
        'plan to watch'
    ),
    IN p_anim_tier ENUM(
        'S',
        'A',
        'B',
        'C',
        'D'
    ),
    IN p_anim_score TINYINT UNSIGNED,
    IN p_anim_personal_notes TEXT
)
BEGIN

    DECLARE v_total_ep INT UNSIGNED DEFAULT 0;
    DECLARE v_final_status VARCHAR(20);


    -- Mengambil total episode anime milik user.
    SELECT anim_total_episode
    INTO v_total_ep
    FROM animes
    WHERE anim_id = p_anim_id
      AND us_id = p_us_id;


    -- Menggunakan status yang dikirim user sebagai default.
    SET v_final_status = p_anim_status;


    -- Jika progress sudah mencapai total episode,
    -- status otomatis menjadi completed.
    IF v_total_ep > 0
       AND p_anim_current_episode >= v_total_ep THEN

        SET v_final_status = 'completed';

    END IF;


    -- Update hanya anime milik user yang sedang login.
    UPDATE animes
    SET
        anim_current_episode = p_anim_current_episode,
        anim_status = v_final_status,
        anim_tier = p_anim_tier,
        anim_score = p_anim_score,
        anim_personal_notes = p_anim_personal_notes
    WHERE anim_id = p_anim_id
      AND us_id = p_us_id;


    -- Mengembalikan data setelah update.
    SELECT *
    FROM animes
    WHERE anim_id = p_anim_id
      AND us_id = p_us_id;

END//


DELIMITER ;


-- ============================================================
-- TEST / DEVELOPMENT
-- ============================================================

-- Melihat seluruh user
-- SELECT * FROM users;

-- Melihat seluruh anime dalam My List
-- SELECT * FROM animes;