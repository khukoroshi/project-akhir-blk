CREATE DATABASE AniWatchList;
USE AniWatchList;-- 

CREATE TABLE users(
	us_id INT unsigned auto_increment primary key,
    us_name varchar(50) not null unique,
    us_email varchar(100) not null unique,
    us_password varchar(255) not null,
    us_created_at timestamp default current_timestamp
);

CREATE TABLE animes(
	anim_id INT unsigned auto_increment primary key,
    us_id INT unsigned not null,
    mal_id INT UNSIGNED NULL,
    anim_title varchar(255) not null,
    anim_img_url text,
    anim_current_episode int unsigned default 0,
    anim_total_episode int unsigned default 0,
    anim_type ENUM('TV', 'Movie', 'OVA', 'ONA', 'Special') DEFAULT 'TV',
    anim_status ENUM('watching', 'completed', 'dropped', 'plan to watch') DEFAULT 'watching',
    anim_tier ENUM('S', 'A', 'B', 'C', 'D') NULL,
    anim_score TINYINT UNSIGNED CHECK (anim_score BETWEEN 1 AND 10),
    anim_personal_notes text,
    anim_created_at timestamp default current_timestamp,
    CONSTRAINT fk_anime_user
		foreign key(us_id) references users(us_id)
        on delete cascade
        on update cascade
);


DELIMITER //

CREATE PROCEDURE sp_insert_anime(
    IN p_us_id INT UNSIGNED,
    IN p_mal_id INT UNSIGNED,
    IN p_anim_title VARCHAR(255),
    IN p_anim_img_url TEXT,
    IN p_anim_total_episode INT UNSIGNED,
    IN p_anim_type ENUM('TV', 'Movie', 'OVA', 'ONA', 'Special'),
    IN p_anim_status ENUM('watching', 'completed', 'dropped', 'plan to watch'),
    IN p_anim_tier ENUM('S', 'A', 'B', 'C', 'D'),
    IN p_anim_score TINYINT UNSIGNED,
    IN p_anim_personal_notes TEXT
)
BEGIN
    DECLARE v_current_ep INT UNSIGNED DEFAULT 0;
    IF p_anim_status = 'completed' AND p_anim_total_episode > 0 THEN
        SET v_current_ep = p_anim_total_episode;
    END IF;

    INSERT INTO animes (
        us_id,
        mal_id,
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
        p_mal_id,
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
    SELECT * FROM animes WHERE anim_id = LAST_INSERT_ID();
END //

CREATE PROCEDURE sp_insert_user (
	p_us_name varchar(50),
    p_us_email varchar(100),
    p_us_password varchar(255)
)
BEGIN
	INSERT INTO users (us_name, us_email, us_password) 
    VALUES (p_us_name, p_us_email, p_us_password);
END//

DELIMITER ;