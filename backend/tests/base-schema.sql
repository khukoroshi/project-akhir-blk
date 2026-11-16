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