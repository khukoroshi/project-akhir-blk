CREATE DATABASE AniWatchList;

USE AniWatchList;

CREATE TABLE users(
	us_id INT unsigned auto_increment primary key,
    us_name varchar(50) not null unique,
    us_email varchar(100) not null unique,
    us_password varchar(255) not null,
    us_created_at timestamp default current_timestamp
);

CREATE TABLE animes(
	anim_id INT auto_increment primary key,
    user_id INT unsigned,
    anim_title varchar(255),
    anim_img_url text,
    anim_current_episode int unsigned,
    anim_total_episode int unsigned,
    anim_status enum('completed', 'watching', 'droped', 'add_to_list'),
    anim_tier enum('S', 'A', 'B', 'C', 'D', 'E', 'F'),
    anim_personal_notes text,
    anim_created_at timestamp default current_timestamp
);